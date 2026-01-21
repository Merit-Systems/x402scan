import { serverErr } from '@x402scan/neverthrow/server';

import { NextResponse } from 'next/server';

import type { ServerErrorType, ServerResult } from '@x402scan/neverthrow/types';

const surface = 'api';

export const apiErr = serverErr(surface);

const errorTypeToStatusCode = {
  invalid_request: 400,
  unauthorized: 401,
  payment_required: 402,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limit: 429,
  internal: 500,
  bad_gateway: 502,
  service_unavailable: 503,
  offline: 503,
} as const satisfies Record<ServerErrorType, number>;

export const toNextResponse = <T>(result: ServerResult<T, string>) =>
  result.match(
    data => NextResponse.json(data),
    error =>
      NextResponse.json(error, { status: errorTypeToStatusCode[error.type] })
  );
