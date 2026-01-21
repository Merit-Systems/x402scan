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

export type ServerError<Surface extends string> = Error<
  ServerErrorType,
  Surface
>;

export type ServerResult<T, Surface extends string> = Result<
  T,
  ServerErrorType,
  Surface
>;

export type ServerResultAsync<T, Surface extends string> = ResultAsync<
  T,
  ServerErrorType,
  Surface
>;
