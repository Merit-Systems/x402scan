import {
  ResultAsync as NeverthrowResultAsync,
  Result as NeverthrowResult,
  ok as neverthrowOk,
  err as neverthrowErr,
  okAsync as neverthrowOkAsync,
  errAsync as neverthrowErrAsync,
} from 'neverthrow';

import type { ResultAsync, BaseError, Error, Result } from './types';

export function resultFromPromise<
  ErrorTypes extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  T = unknown,
>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BE
): ResultAsync<T, ErrorTypes, BE> {
  return NeverthrowResultAsync.fromPromise(promise, e => ({
    ...error(e),
    surface,
  }));
}

export function resultFromThrowable<
  ErrorTypes extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  T = unknown,
>(
  surface: string,
  fn: () => T,
  error: (e: unknown) => BE
): Result<T, ErrorTypes, BE> {
  return NeverthrowResult.fromThrowable(fn, e => ({
    ...error(e),
    surface,
  }))();
}

export function resultFromSafePromise<
  ErrorTypes extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  T = unknown,
>(promise: Promise<T>): ResultAsync<T, ErrorTypes, BE> {
  return NeverthrowResultAsync.fromSafePromise(promise);
}

export function ok<T>(data: T) {
  // surface is unused, included for symmetry/typing
  return neverthrowOk(data);
}

export function err<
  ErrorTypes extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
>(surface: string, error: BE) {
  return neverthrowErr<never, Error<ErrorTypes, BE>>({
    ...error,
    surface,
  });
}

export function okAsync<T>(data: T): ResultAsync<T, never, never> {
  // surface is unused, included for symmetry/typing
  return neverthrowOkAsync(data);
}

export function errAsync<
  ErrorTypes extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
>(surface: string, error: BE) {
  return neverthrowErrAsync({
    ...error,
    surface,
  });
}
