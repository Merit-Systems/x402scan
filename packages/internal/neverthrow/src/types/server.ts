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

export type ServerError = Error<BaseServerError>;

export type ServerResult<T> = Result<T, BaseServerError>;

export type ServerResultAsync<T> = ResultAsync<T, BaseServerError>;
