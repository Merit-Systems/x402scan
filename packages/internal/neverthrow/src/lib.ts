import {
  ResultAsync as NeverthrowResultAsync,
  ok as neverthrowOk,
  err as neverthrowErr,
  okAsync as neverthrowOkAsync,
  errAsync as neverthrowErrAsync,
} from 'neverthrow';

import type { ResultAsync, BaseError, Error } from './types';

export const resultFromPromise =
  <
    ErrorTypes extends string,
    Surface extends string,
    BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
  >(
    surface: Surface
  ) =>
  <T>(
    promise: Promise<T>,
    error: (e: unknown) => BE
  ): ResultAsync<T, ErrorTypes, Surface, BE> =>
    NeverthrowResultAsync.fromPromise(promise, e => ({
      ...error(e),
      surface,
    }));

export const ok =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <Surface extends string>(surface: Surface) =>
    <T>(data: T) =>
      neverthrowOk(data);

export const err =
  <ErrorTypes extends string, Surface extends string>(surface: Surface) =>
  <BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>>(error: BE) =>
    neverthrowErr<never, Error<ErrorTypes, Surface>>({
      ...error,
      surface,
    });

export const okAsync =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <Surface extends string>(surface: Surface) =>
    <T>(data: T): ResultAsync<T, never, Surface, never> =>
      neverthrowOkAsync(data);

export const errAsync =
  <ErrorTypes extends string, Surface extends string>(surface: Surface) =>
  <BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>>(error: BE) =>
    neverthrowErrAsync({
      ...error,
      surface,
    });

export const resultFromSafePromise =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <Surface extends string>(surface: Surface) =>
    <T>(promise: Promise<T>): ResultAsync<T, never, Surface, never> =>
      NeverthrowResultAsync.fromSafePromise(promise);
