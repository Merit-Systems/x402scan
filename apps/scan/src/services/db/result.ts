import {
  serverResultFromPromise,
  serverErr,
  serverOk,
} from '@x402scan/neverthrow/server';
import type { BaseServerError } from '@x402scan/neverthrow/types';

const surface = 'database';

export const dbOk = <T>(data: T) => serverOk(surface, data);
export const dbErr = (error: Parameters<typeof serverErr>[1]) =>
  serverErr(surface, error);
export const dbResultFromPromise = <T>(
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => serverResultFromPromise(surface, promise, error);
