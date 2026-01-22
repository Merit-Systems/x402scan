import type {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
  Err as NeverthrowErr,
} from 'neverthrow';

export interface BaseError<ErrorCause extends string = string> {
  cause: ErrorCause;
  message: string;
}

// Now only needs BE
export type Error<E extends BaseError> = E & { type: string; surface: string };

// Only needs T and BE - ErrorTypes derived internally
export type Result<T, E extends BaseError> = NeverthrowResult<T, Error<E>>;

export type ResultAsync<T, E extends BaseError> = NeverthrowResultAsync<
  T,
  Error<E>
>;

export type Err<T, E extends BaseError> = NeverthrowErr<T, Error<E>>;
