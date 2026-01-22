import { serverResultFromPromise, serverErr } from '@/lib/server-result';

import type {
  ServerResultAsync,
  ServerError,
  BaseServerError,
} from '@/lib/server-result';

const surface = 'cdp';

export type CdpResultAsync<T> = ServerResultAsync<T>;
export type CdpError = ServerError;

export const cdpErr = (error: BaseServerError) => serverErr(surface, error);
export const cdpResultFromPromise = <T>(
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => serverResultFromPromise(surface, promise, error);
