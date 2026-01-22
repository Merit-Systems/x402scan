import { err, ok, resultFromPromise } from '.';

import type { BaseServerError } from './types/server';

export const serverResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => resultFromPromise(surface, promise, error);

export const serverOk = <T>(data: T) => ok(data);

export const serverErr = (surface: string, error: BaseServerError) =>
  err(surface, error);
