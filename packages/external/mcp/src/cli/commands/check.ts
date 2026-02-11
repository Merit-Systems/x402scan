import { randomBytes } from 'crypto';

import {
  successResponse,
  errorResponse,
  fromNeverthrowError,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import { buildRequest } from '@/server/tools/lib/request';
import { checkEndpoint } from '@/shared/operations';
import { safeParseResponse } from '@/shared/neverthrow/fetch';
import { getWalletOrExit, parseRequestInput } from './lib';

import type { GlobalFlags } from '@/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const SURFACE = 'cli:check';

interface CheckArgs {
  url: string;
  method?: string;
  body?: string;
  headers?: string;
}

export async function checkCommand(
  args: CheckArgs,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const { account } = await getWalletOrExit(flags);
  const sessionId = randomBytes(16).toString('hex');

  const input = parseRequestInput(SURFACE, args, flags);

  const request = buildRequest({
    input,
    address: account.address,
    sessionId,
  });

  const result = await checkEndpoint(SURFACE, request);

  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), flags);
  }

  const value = result.value;

  // Handle Response (non-ok HTTP response)
  if (value instanceof Response) {
    const response = value;
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
    return outputAndExit(
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

  // Handle CheckEndpointPaidResult
  if ('requiresPayment' in value && value.requiresPayment) {
    return outputAndExit(
      successResponse({
        requiresPayment: true,
        statusCode: value.statusCode,
        routeDetails: value.routeDetails,
      }),
      flags
    );
  }

  // Handle CheckEndpointFreeResult
  if ('parsedResponse' in value) {
    const { parsedResponse } = value;
    const data =
      parsedResponse.type === 'json'
        ? parsedResponse.data
        : parsedResponse.type === 'text'
          ? parsedResponse.data
          : { type: parsedResponse.type };

    return outputAndExit(
      successResponse({
        requiresPayment: false,
        statusCode: value.statusCode,
        data,
      }),
      flags
    );
  }

  // Fallback - shouldn't reach here
  return outputAndExit(
    errorResponse({
      code: 'GENERAL_ERROR',
      message: 'Unexpected response format',
      surface: SURFACE,
      cause: 'unknown',
    }),
    flags
  );
}
