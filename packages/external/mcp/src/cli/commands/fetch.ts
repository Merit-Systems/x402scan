import { randomBytes } from 'crypto';

import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';

import {
  successResponse,
  errorResponse,
  fromNeverthrowError,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import { buildRequest } from '@/server/tools/lib/request';
import { DEFAULT_NETWORK } from '@/shared/networks';
import { tokenStringToNumber } from '@/shared/token';
import { safeParseResponse } from '@/shared/neverthrow/fetch';
import { safeGetPaymentSettlement } from '@/shared/neverthrow/x402';
import { createFetchWithPayment } from '@/shared/operations';
import { getWalletOrExit, parseRequestInput } from './lib';

import type { GlobalFlags } from '@/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const SURFACE = 'cli:fetch';

interface FetchArgs {
  url: string;
  method?: string;
  body?: string;
  headers?: string;
}

export async function fetchCommand(
  args: FetchArgs,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const { account } = await getWalletOrExit(flags);
  const sessionId = randomBytes(16).toString('hex');

  const input = parseRequestInput(SURFACE, args, flags);

  // Set up x402 client
  const coreClient = x402Client.fromConfig({
    schemes: [
      { network: DEFAULT_NETWORK, client: new ExactEvmScheme(account) },
    ],
  });

  const client = new x402HTTPClient(coreClient);

  const request = buildRequest({
    input,
    address: account.address,
    sessionId,
  });

  const fetchWithPay = createFetchWithPayment(SURFACE, client);
  const fetchResult = await fetchWithPay(request);

  if (fetchResult.isErr()) {
    outputAndExit(fromNeverthrowError(fetchResult), flags);
  }

  const { response, paymentPayload } = fetchResult.value;

  if (!response.ok) {
    const parseResult = await safeParseResponse(SURFACE, response);
    const details: JsonObject = { statusCode: response.status };
    if (parseResult.isOk()) {
      const { type } = parseResult.value;
      if (type === 'json') {
        details.body = parseResult.value.data;
      } else if (type === 'text') {
        details.body = parseResult.value.data;
      } else {
        details.bodyType = type;
      }
    }
    outputAndExit(
      errorResponse({
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
        surface: SURFACE,
        cause: 'http',
        details,
      }),
      flags
    );
  }

  const parseResponseResult = await safeParseResponse(SURFACE, response);
  if (parseResponseResult.isErr()) {
    outputAndExit(fromNeverthrowError(parseResponseResult), flags);
  }

  const settlementResult = safeGetPaymentSettlement(SURFACE, client, response);

  // Build response data
  const data =
    parseResponseResult.value.type === 'json'
      ? parseResponseResult.value.data
      : parseResponseResult.value.type === 'text'
        ? parseResponseResult.value.data
        : { type: parseResponseResult.value.type };

  // Build metadata
  const metadata =
    settlementResult.isOk() || paymentPayload !== undefined
      ? {
          ...(paymentPayload !== undefined
            ? {
                price: tokenStringToNumber(
                  paymentPayload.accepted.amount
                ).toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }),
              }
            : {}),
          ...(settlementResult.isOk()
            ? {
                payment: {
                  success: settlementResult.value.success,
                  transactionHash: settlementResult.value.transaction,
                },
              }
            : {}),
        }
      : undefined;

  outputAndExit(successResponse(data, metadata), flags);
}
