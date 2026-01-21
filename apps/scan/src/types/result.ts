import type {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
} from 'neverthrow';

export type ErrorType =
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

export interface BaseError {
  type: ErrorType;
  message: string;
}

export type Error<Surface extends string> = BaseError & {
  surface: Surface;
};

export type Result<T, Surface extends string> = NeverthrowResult<
  T,
  Error<Surface>
>;

export type ResultAsync<T, Surface extends string> = NeverthrowResultAsync<
  T,
  Error<Surface>
>;
