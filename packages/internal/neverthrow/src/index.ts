import {
  ResultAsync as NeverthrowResultAsync,
  Result as NeverthrowResult,
  ok as neverthrowOk,
  err as neverthrowErr,
  okAsync as neverthrowOkAsync,
  errAsync as neverthrowErrAsync,
} from 'neverthrow';

import type { ResultAsync, BaseError, Error, Result } from './types';

export function resultFromPromise<E extends BaseError, T = unknown>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => E
): ResultAsync<T, E> {
  return NeverthrowResultAsync.fromPromise(promise, e => ({
    ...error(e),
    surface,
  }));
}

export function resultFromThrowable<E extends BaseError, T = unknown>(
  surface: string,
  fn: () => T,
  error: (e: unknown) => E
): Result<T, E> {
  return NeverthrowResult.fromThrowable(fn, e => ({
    ...error(e),
    surface,
  }))();
}

export function resultFromSafePromise<E extends BaseError, T = unknown>(
  promise: Promise<T>
): ResultAsync<T, E> {
  return NeverthrowResultAsync.fromSafePromise(promise);
}

export function ok<T>(data: T) {
  return neverthrowOk(data);
}

export function err<BE extends BaseError>(surface: string, error: BE) {
  return neverthrowErr<never, Error<BE>>({
    ...error,
    surface,
  });
}

export function okAsync<T>(data: T): ResultAsync<T, never> {
  return neverthrowOkAsync(data);
}

export function errAsync<E extends BaseError>(surface: string, error: E) {
  return neverthrowErrAsync({
    ...error,
    surface,
  });
}
