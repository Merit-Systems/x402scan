import { err, ok, resultFromPromise } from './lib';

import type { BaseServerError, ServerErrorType } from './types';

export const serverResultFromPromise =
  <Surface extends string>(surface: Surface) =>
  <T>(promise: Promise<T>, error: string | ((e: unknown) => BaseServerError)) =>
    resultFromPromise<ServerErrorType, Surface>(surface)(
      promise,
      error,
      'internal'
    );

export const serverOk =
  <Surface extends string>(surface: Surface) =>
  <T>(data: T) =>
    ok(surface)(data);

export const serverErr =
  <Surface extends string>(surface: Surface) =>
  (error: BaseServerError) =>
    err<ServerErrorType, Surface>(surface)(error);
