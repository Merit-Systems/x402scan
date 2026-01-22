import type { BaseError, Result, ResultAsync, Error } from './base';

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

export type ServerError = Error<ServerErrorType>;

export type ServerResult<T> = Result<T, ServerErrorType>;

export type ServerResultAsync<T> = ResultAsync<T, ServerErrorType>;
