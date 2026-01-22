import type {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
} from 'neverthrow';

export interface BaseError<ErrorTypes extends string = string> {
  type: ErrorTypes;
  message: string;
}

// Now only needs BE
export type Error<E extends BaseError> = E & { surface: string };

// Only needs T and BE - ErrorTypes derived internally
export type Result<T, E extends BaseError> = NeverthrowResult<T, Error<E>>;

export type ResultAsync<T, E extends BaseError> = NeverthrowResultAsync<
  T,
  Error<E>
>;
