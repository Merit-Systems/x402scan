import { err } from '@/lib/result';

import { NextResponse } from 'next/server';

import type { ErrorType, Result } from '@/types/result';

const surface = 'api';

export const apiErr = err(surface);

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
} as const satisfies Record<ErrorType, number>;

export const toNextResponse = (result: Result<object, string>) =>
  result.match(
    data => NextResponse.json(data),
    error =>
      NextResponse.json(error, { status: errorTypeToStatusCode[error.type] })
  );
