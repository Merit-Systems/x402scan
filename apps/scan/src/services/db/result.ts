import {
  serverResultFromPromise,
  serverErr,
  serverOk,
} from '@/lib/server-result';

import type { BaseServerError } from '@/lib/server-result';

const type = 'database';

export const dbOk = <T>(data: T) => serverOk(data);
export const dbErr = (surface: string, error: BaseServerError) =>
  serverErr(type, surface, error);
export const dbResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => serverResultFromPromise(type, surface, promise, error);
