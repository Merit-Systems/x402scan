/**
 * x402 HTTP client - handles the 402 payment flow
 */

import { x402Client } from '@x402/core/client';
import { x402HTTPClient } from '@x402/core/http';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

import { privateKeyToAccount } from 'viem/accounts';

import { normalizePaymentRequired } from './protocol';

import { log } from '@/lib/log';
import { toCaip2 } from '../networks';

import type { PrivateKeyAccount } from 'viem/accounts';
import type { PaymentRequired, PaymentPayload } from '@x402/core/types';
import type { NormalizedPaymentRequired } from './protocol';

// Cached parse-only client (no real signing needed)
let parseClient: x402HTTPClient | null = null;
const DUMMY_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

export function getParseClient(): x402HTTPClient {
  if (!parseClient) {
    const core = new x402Client();
    registerExactEvmScheme(core, { signer: privateKeyToAccount(DUMMY_KEY) });
    parseClient = new x402HTTPClient(core);
  }
  return parseClient;
}

export function createClient(
  account: PrivateKeyAccount,
  preferredNetwork?: string
) {
  const core = new x402Client(
    preferredNetwork
      ? (_v, accepts) =>
          accepts.find(a => toCaip2(a.network) === toCaip2(preferredNetwork)) ??
          accepts[0]!
      : undefined
  );
  registerExactEvmScheme(core, { signer: account });
  return new x402HTTPClient(core);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Make a request to an x402-protected endpoint
 * Handles the full 402 payment flow automatically
 */
export async function makeRequest<T = unknown>(
  client: x402HTTPClient,
  url: string,
  opts: RequestOptions = {}
) {
  const { method = 'GET', body, headers = {} } = opts;

  // Phase 1: Initial request
  log.debug(`Making initial request: ${method} ${url}`);

  let firstResponse: Response;
  try {
    firstResponse = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      error: {
        phase: 'initial_request',
        message: `Network error: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
    };
  }

  // Not 402 - return as-is
  if (firstResponse.status !== 402) {
    if (firstResponse.ok) {
      try {
        return {
          success: true,
          statusCode: firstResponse.status,
          data: (await firstResponse.json()) as T,
        };
      } catch {
        return {
          success: true,
          statusCode: firstResponse.status,
          data: (await firstResponse.text()) as unknown as T,
        };
      }
    }
    return {
      success: false,
      statusCode: firstResponse.status,
      error: {
        phase: 'initial_request',
        message: `HTTP ${firstResponse.status}: ${await firstResponse.text()}`,
      },
    };
  }

  // Phase 2: Parse payment requirements
  log.debug('Got 402, parsing requirements...');

  let rawPaymentRequired: PaymentRequired;
  let paymentRequired: NormalizedPaymentRequired;
  let responseBody: unknown;

  try {
    try {
      responseBody = await firstResponse.clone().json();
    } catch {
      responseBody = undefined;
    }

    rawPaymentRequired = client.getPaymentRequiredResponse(
      name => firstResponse.headers.get(name),
      responseBody
    );
    paymentRequired = normalizePaymentRequired(rawPaymentRequired);
    log.debug('Payment required:', paymentRequired);
  } catch (err) {
    return {
      success: false,
      statusCode: 402,
      error: {
        phase: 'parse_requirements',
        message: `Failed to parse payment requirements: ${
          err instanceof Error ? err.message : String(err)
        }`,
        details: {
          headers: Object.fromEntries(firstResponse.headers.entries()),
          body: responseBody,
        },
      },
    };
  }

  // Phase 3: Create signed payment
  log.debug('Creating payment payload...');

  let paymentPayload: PaymentPayload;
  try {
    paymentPayload = await client.createPaymentPayload(rawPaymentRequired);
    log.debug(
      `Payment created for network: ${paymentPayload.accepted?.network}`
    );
  } catch (err) {
    return {
      success: false,
      statusCode: 402,
      paymentRequired,
      error: {
        phase: 'create_signature',
        message: `Failed to create payment: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
    };
  }

  const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);
  log.debug('Payment headers:', Object.keys(paymentHeaders).join(', '));

  // Phase 4: Retry with payment
  log.debug('Retrying with payment...');

  let paidResponse: Response;
  try {
    paidResponse = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...paymentHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      paymentRequired,
      error: {
        phase: 'paid_request',
        message: `Network error on paid request: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
    };
  }

  if (!paidResponse.ok) {
    return {
      success: false,
      statusCode: paidResponse.status,
      paymentRequired,
      error: {
        phase: 'paid_request',
        message: `HTTP ${
          paidResponse.status
        } after payment: ${await paidResponse.text()}`,
        details: {
          headers: Object.fromEntries(paidResponse.headers.entries()),
        },
      },
    };
  }

  // Phase 5: Parse settlement
  let settlement;
  try {
    const settle = client.getPaymentSettleResponse(name =>
      paidResponse.headers.get(name)
    );
    log.debug('Settlement:', settle);
    settlement = {
      transactionHash: settle.transaction,
      network: settle.network,
      payer: settle.payer ?? paymentPayload.accepted?.payTo ?? '',
    };
  } catch (err) {
    log.debug(
      `Could not parse settlement: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  // Parse response data
  let data: T;
  try {
    data = (await paidResponse.json()) as T;
  } catch {
    data = (await paidResponse.text()) as unknown as T;
  }

  return {
    success: true,
    statusCode: paidResponse.status,
    data,
    settlement,
    paymentRequired,
  };
}

/**
 * Query an endpoint for payment requirements without making payment
 */
export async function queryEndpoint(
  url: string,
  opts: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', body, headers = {} } = opts;
  const client = getParseClient();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      error: `Network error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  const rawHeaders = Object.fromEntries(response.headers.entries());

  if (response.status !== 402) {
    return { success: true, statusCode: response.status, rawHeaders };
  }

  let rawBody: unknown;
  try {
    rawBody = await response.json();
  } catch {
    rawBody = undefined;
  }

  try {
    const raw = client.getPaymentRequiredResponse(
      name => response.headers.get(name),
      rawBody
    );
    const paymentRequired = normalizePaymentRequired(raw);
    return {
      success: true,
      statusCode: 402,
      x402Version: paymentRequired.x402Version,
      paymentRequired,
      rawHeaders,
      rawBody,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 402,
      error: `Failed to parse payment requirements: ${
        err instanceof Error ? err.message : String(err)
      }`,
      parseErrors: [err instanceof Error ? err.message : String(err)],
      rawHeaders,
      rawBody,
    };
  }
}
