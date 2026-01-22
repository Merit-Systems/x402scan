import { serverErr } from '@/lib/server-result';

import { NextResponse } from 'next/server';

import type {
  BaseServerError,
  ServerErrorType,
  ServerResult,
} from '@/lib/server-result';

const surface = 'api';

export const apiErr = (error: BaseServerError) => serverErr(surface, error);

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

export const toNextResponse = <T>(result: ServerResult<T>) =>
  result.match(
    data => NextResponse.json(data),
    error =>
      NextResponse.json(error, { status: errorTypeToStatusCode[error.cause] })
  );
