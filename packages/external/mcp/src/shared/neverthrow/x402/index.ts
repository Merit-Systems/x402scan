import {
  err,
  ok,
  resultFromPromise,
  resultFromThrowable,
} from '@x402scan/neverthrow';
import { createSIWxPayload } from '@x402scan/siwx';

import { fetchErr, fetchOk, safeFetch } from '../fetch';

import type { BaseX402Error } from './types';
import { x402HTTPClient } from '@x402/core/http';
import type { PaymentRequired } from '@x402/core/types';
import type { SIWxExtensionInfo } from '@x402scan/siwx/types';
import type { PrivateKeyAccount } from 'viem';
import { x402Client } from '@x402/core/client';
import { DEFAULT_NETWORK } from '@/shared/networks';
import { ExactEvmScheme } from '@x402/evm';
import { tokenStringToNumber } from '@/shared/token';
import { checkBalance } from '@/server/tools/lib/check-balance';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GlobalFlags } from '@/types';

const errorType = 'x402';

const x402Ok = <T>(value: T) => ok(value);
const x402Err = (cause: string, error: BaseX402Error) =>
  err(errorType, cause, error);

const x402ResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseX402Error
) => resultFromPromise(errorType, surface, promise, error);

const x402ResultFromThrowable = <T>(
  surface: string,
  fn: () => T,
  error: (e: unknown) => BaseX402Error
) => resultFromThrowable(errorType, surface, fn, error);

export const safeGetPaymentRequired = (
  surface: string,
  client: x402HTTPClient,
  response: Response
) => {
  return x402ResultFromPromise(
    surface,
    response.json().then(
      json =>
        client.getPaymentRequiredResponse(
          name => response.headers.get(name),
          json
        ),
      () =>
        client.getPaymentRequiredResponse(name => response.headers.get(name))
    ),
    error => ({
      cause: 'parse_payment_required',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to parse payment required',
    })
  );
};

const safeCreatePaymentPayload = (
  surface: string,
  client: x402HTTPClient,
  paymentRequired: PaymentRequired
) => {
  return x402ResultFromPromise(
    surface,
    client.createPaymentPayload(paymentRequired),
    error => ({
      cause: 'create_payment_payload',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create payment payload',
    })
  );
};

const safeGetPaymentSettlement = (surface: string, response: Response) => {
  return x402ResultFromThrowable(
    surface,
    () =>
      new x402HTTPClient(new x402Client()).getPaymentSettleResponse(name =>
        response.headers.get(name)
      ),
    error => ({
      cause: 'get_payment_settlement',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to get payment settlement',
    })
  );
};

export const safeCreateSIWxPayload = (
  surface: string,
  serverInfo: SIWxExtensionInfo,
  signer: PrivateKeyAccount
) => {
  return x402ResultFromPromise(
    surface,
    createSIWxPayload(serverInfo, signer),
    error => ({
      cause: 'create_siwx_payload',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create SIWX payload',
    })
  );
};

interface SafeWrapFetchWithPaymentProps {
  account: PrivateKeyAccount;
  server: McpServer;
  surface: string;
  flags: GlobalFlags;
}

export const safeWrapFetchWithPayment = ({
  account,
  server,
  surface,
  flags,
}: SafeWrapFetchWithPaymentProps) => {
  const coreClient = x402Client.fromConfig({
    schemes: [
      { network: DEFAULT_NETWORK, client: new ExactEvmScheme(account) },
    ],
  });

  coreClient.onBeforePaymentCreation(async ({ selectedRequirements }) => {
    const amount = tokenStringToNumber(selectedRequirements.amount);
    await checkBalance({
      surface: surface,
      server,
      address: account.address,
      amountNeeded: amount,
      message: balance =>
        `This request costs ${amount} USDC. Your current balance is ${balance} USDC.`,
      flags,
    });
  });

  const client = new x402HTTPClient(coreClient);

  return async (request: Request) => {
    const clonedRequest = request.clone();

    const probeResult = await safeFetch(surface, request);

    if (probeResult.isErr()) {
      return fetchErr(surface, probeResult.error);
    }

    if (probeResult.value.status !== 402) {
      return probeResult.andThen(response =>
        fetchOk({
          response,
          paymentPayload: undefined,
          settlement: undefined,
        })
      );
    }

    const response = probeResult.value;

    const paymentRequiredResult = await safeGetPaymentRequired(
      surface,
      client,
      response
    );

    if (paymentRequiredResult.isErr()) {
      return paymentRequiredResult;
    }

    const paymentRequired = paymentRequiredResult.value;

    const paymentPayloadResult = await safeCreatePaymentPayload(
      surface,
      client,
      paymentRequired
    );

    if (paymentPayloadResult.isErr()) {
      return paymentPayloadResult;
    }

    const paymentPayload = paymentPayloadResult.value;

    // Encode payment header
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    // Check if this is already a retry to prevent infinite loops
    if (
      clonedRequest.headers.has('PAYMENT-SIGNATURE') ||
      clonedRequest.headers.has('X-PAYMENT')
    ) {
      return x402Err(surface, {
        cause: 'payment_already_attempted',
        message: 'Payment already attempted',
      });
    }

    // Add payment headers to cloned request
    for (const [key, value] of Object.entries(paymentHeaders)) {
      clonedRequest.headers.set(key, value);
    }
    clonedRequest.headers.set(
      'Access-Control-Expose-Headers',
      'PAYMENT-RESPONSE,X-PAYMENT-RESPONSE'
    );

    // Retry the request with payment
    const retryResult = await safeFetch(surface, clonedRequest);

    if (retryResult.isErr()) {
      return retryResult;
    }

    const settlementResult = safeGetPaymentSettlement(
      surface,
      retryResult.value
    );

    return x402Ok({
      response: retryResult.value,
      paymentPayload,
      settlement: settlementResult.match(
        ok => ok,
        () => undefined
      ),
    });
  };
};

interface CheckX402EndpointProps {
  surface: string;
  resource: string;
}

export const safeCheckX402Endpoint = async ({
  surface,
  resource,
}: CheckX402EndpointProps) => {
  const postResult = await safeGetX402Response({
    surface,
    resource,
    request: new Request(resource, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  });

  if (postResult.isOk()) {
    return postResult;
  }

  const getResult = await safeGetX402Response({
    surface,
    resource,
    request: new Request(resource, { method: 'GET' }),
  });

  if (getResult.isOk()) {
    return getResult;
  }

  return x402Err(surface, {
    cause: 'not_x402',
    message: `Resource did not return 402: ${resource}`,
  });
};

interface GetResourceResponseProps extends CheckX402EndpointProps {
  request: Request;
}

const safeGetX402Response = async ({
  surface,
  resource,
  request,
}: GetResourceResponseProps) => {
  const client = new x402HTTPClient(new x402Client());

  const fetchResult = await safeFetch(surface, request);

  if (fetchResult.isErr()) {
    return fetchResult;
  }

  const response = fetchResult.value;

  if (response.status !== 402) {
    return x402Err(surface, {
      cause: 'not_x402',
      message: `Resource did not return 402: ${resource}`,
    });
  }

  const paymentRequiredResult = await safeGetPaymentRequired(
    surface,
    client,
    response
  );

  if (paymentRequiredResult.isErr()) {
    return paymentRequiredResult;
  }

  return ok({
    paymentRequired: paymentRequiredResult.value,
    resource,
    method: request.method,
  });
};
