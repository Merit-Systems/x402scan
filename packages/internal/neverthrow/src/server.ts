import { err, ok, resultFromPromise } from '.';

import type { BaseServerError, ServerErrorType } from './types/server';

export const serverResultFromPromise = <Surface extends string, T>(
  surface: Surface,
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) =>
  resultFromPromise<ServerErrorType, Surface, BaseServerError, T>(
    surface,
    promise,
    error
  );

export const serverOk = <Surface extends string, T>(
  surface: Surface,
  data: T
) => ok(surface, data);

export const serverErr = <Surface extends string>(
  surface: Surface,
  error: BaseServerError
) => err<ServerErrorType, Surface, BaseServerError>(surface, error);
