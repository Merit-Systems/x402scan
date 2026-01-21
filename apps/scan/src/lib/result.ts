import {
  ResultAsync as NeverthrowResultAsync,
  ok as neverthrowOk,
  err as neverthrowErr,
} from 'neverthrow';

import type { ResultAsync, BaseError } from '@/types/result';

export const resultFromPromise =
  <Surface extends string>(surface: Surface) =>
  <T>(
    promise: Promise<T>,
    error: string | ((e: unknown) => BaseError)
  ): ResultAsync<T, Surface> =>
    NeverthrowResultAsync.fromPromise(
      promise,
      typeof error === 'function'
        ? e => ({
            ...error(e),
            surface,
          })
        : () => ({
            type: 'internal',
            message: error,
            surface,
          })
    );

export const ok =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <Surface extends string>(_: Surface) =>
    <T>(data: T) =>
      neverthrowOk(data);

export const err =
  <Surface extends string>(surface: Surface) =>
  (error: BaseError) =>
    neverthrowErr({
      ...error,
      surface,
    });
