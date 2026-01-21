import {
  ResultAsync as NeverthrowResultAsync,
  ok as neverthrowOk,
  err as neverthrowErr,
  okAsync as neverthrowOkAsync,
  errAsync as neverthrowErrAsync,
} from 'neverthrow';

import type { ResultAsync, BaseError, Error } from './types';

export function resultFromPromise<
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  T = unknown,
>(
  surface: Surface,
  promise: Promise<T>,
  error: (e: unknown) => BE
): ResultAsync<T, ErrorTypes, Surface, BE> {
  return NeverthrowResultAsync.fromPromise(promise, e => ({
    ...error(e),
    surface,
  }));
}

export function resultFromSafePromise<
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  T = unknown,
>(promise: Promise<T>): ResultAsync<T, ErrorTypes, Surface, BE> {
  return NeverthrowResultAsync.fromSafePromise(promise);
}

export function ok<Surface extends string, T>(surface: Surface, data: T) {
  // surface is unused, included for symmetry/typing
  return neverthrowOk(data);
}

export function err<
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
>(surface: Surface, error: BE) {
  return neverthrowErr<never, Error<ErrorTypes, Surface>>({
    ...error,
    surface,
  });
}

export function okAsync<Surface extends string, T>(
  surface: Surface,
  data: T
): ResultAsync<T, never, Surface, never> {
  // surface is unused, included for symmetry/typing
  return neverthrowOkAsync(data);
}

export function errAsync<
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
>(surface: Surface, error: BE) {
  return neverthrowErrAsync({
    ...error,
    surface,
  });
}
