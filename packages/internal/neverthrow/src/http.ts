import { err, ok, resultFromPromise } from './lib';

import type { BaseError, HttpErrorType } from './types';

export const httpResultFromPromise =
  <Surface extends string>(surface: Surface) =>
  <T>(
    promise: Promise<T>,
    error: string | ((e: unknown) => BaseError<HttpErrorType>)
  ) =>
    resultFromPromise<HttpErrorType, Surface>(surface)(
      promise,
      error,
      'internal'
    );

export const httpOk =
  <Surface extends string>(surface: Surface) =>
  <T>(data: T) =>
    ok(surface)(data);

export const httpErr =
  <Surface extends string>(surface: Surface) =>
  (error: BaseError<HttpErrorType>) =>
    err<HttpErrorType, Surface>(surface)(error);
