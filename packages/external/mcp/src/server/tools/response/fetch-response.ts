import { safeParseResponse } from '@/shared/neverthrow/fetch';

import { mcpError, mcpErrorFetch } from './error';
import { mcpSuccessResponse } from './success';

import type { FetchResult } from '@/shared/neverthrow/fetch/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';
import type { safeWrapFetchWithPayment } from '@/shared/neverthrow/x402';
import { tokenStringToNumber } from '@/shared/token';

interface BaseMcpFetchResponseProps {
  surface: string;
  extra?: JsonObject;
}

interface McpFetchResponseProps extends BaseMcpFetchResponseProps {
  fetchResult: FetchResult;
}

export const mcpFetchResponse = async ({
  surface,
  fetchResult,
  extra,
}: McpFetchResponseProps) => {
  if (fetchResult.isErr()) {
    return mcpError(fetchResult);
  }

  const response = fetchResult.value;

  if (!response.ok) {
    return mcpErrorFetch(surface, response);
  }

  const parseResponseResult = await safeParseResponse(surface, response);

  if (parseResponseResult.isErr()) {
    return mcpError(parseResponseResult);
  }

  return mcpSuccessResponse(parseResponseResult.value, extra);
};

interface McpX402FetchResponseProps extends BaseMcpFetchResponseProps {
  x402FetchResult: Awaited<
    ReturnType<ReturnType<typeof safeWrapFetchWithPayment>>
  >;
}

export const mcpX402FetchResponse = async ({
  surface,
  x402FetchResult,
  extra,
}: McpX402FetchResponseProps) => {
  if (x402FetchResult.isErr()) {
    return mcpError(x402FetchResult);
  }

  const { response, paymentPayload, settlement } = x402FetchResult.value;

  if (!response.ok) {
    return mcpErrorFetch(origin, response);
  }

  const parseResponseResult = await safeParseResponse(surface, response);

  if (parseResponseResult.isErr()) {
    return mcpError(parseResponseResult);
  }

  return mcpSuccessResponse(
    parseResponseResult.value,
    settlement !== undefined || paymentPayload !== undefined
      ? {
          ...extra,
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
          ...(settlement !== undefined
            ? {
                payment: {
                  success: settlement.success,
                  transactionHash: settlement.transaction,
                },
              }
            : {}),
        }
      : extra
  );
};
