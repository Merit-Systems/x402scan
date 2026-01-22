import {
  serverResultFromPromise,
  serverErr,
  serverOk,
} from '@/lib/server-result';

import type { BaseServerError } from '@/lib/server-result';

const surface = 'database';

export const dbOk = <T>(data: T) => serverOk(data);
export const dbErr = (error: BaseServerError) => serverErr(surface, error);
export const dbResultFromPromise = <T>(
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => serverResultFromPromise(surface, promise, error);
