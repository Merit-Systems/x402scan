import { err, ok, resultFromPromise } from '@x402scan/neverthrow';

import type {
  BaseError,
  Result,
  ResultAsync,
  Error,
} from '@x402scan/neverthrow/types';

export type ServerErrorType =
  | 'invalid_request'
  | 'unauthorized'
  | 'payment_required'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'internal'
  | 'bad_gateway'
  | 'service_unavailable'
  | 'offline';

export type BaseServerError = BaseError<ServerErrorType>;

export type ServerResult<T> = Result<T, BaseServerError>;

export type ServerError = Error<BaseServerError>;

export type ServerResultAsync<T> = ResultAsync<T, BaseServerError>;

const errorType = 'server';

export const serverResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: BaseServerError | ((e: unknown) => BaseServerError)
) =>
  resultFromPromise(
    errorType,
    surface,
    promise,
    error instanceof Function ? error : () => error
  );

export const serverOk = <T>(data: T) => ok(data);

export const serverErr = (surface: string, error: BaseServerError) =>
  err(errorType, surface, error);
