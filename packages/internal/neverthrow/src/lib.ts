import {
  ResultAsync as NeverthrowResultAsync,
  ok as neverthrowOk,
  err as neverthrowErr,
} from 'neverthrow';

import type { ResultAsync, BaseError } from './types';

export const resultFromPromise =
  <ErrorTypes extends string, Surface extends string>(surface: Surface) =>
  <T>(
    promise: Promise<T>,
    error: string | ((e: unknown) => BaseError<ErrorTypes>),
    defaultError: ErrorTypes
  ): ResultAsync<T, ErrorTypes, Surface> =>
    NeverthrowResultAsync.fromPromise(
      promise,
      typeof error === 'function'
        ? e => ({
            ...error(e),
            surface,
          })
        : () => ({
            type: defaultError,
            message: error,
            surface,
          })
    );

export const ok =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <Surface extends string>(surface: Surface) =>
    <T>(data: T) =>
      neverthrowOk(data);

export const err =
  <ErrorTypes extends string, Surface extends string>(surface: Surface) =>
  (error: BaseError<ErrorTypes>) =>
    neverthrowErr({
      ...error,
      surface,
    });
