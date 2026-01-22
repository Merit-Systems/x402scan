import { serverResultFromPromise, serverErr } from '@/lib/server-result';

import type { ServerResultAsync, BaseServerError } from '@/lib/server-result';
import type { Err } from '@x402scan/neverthrow/types';

const type = 'cdp';

export type CdpResultAsync<T> = ServerResultAsync<T>;
export type CdpErr<T> = Err<T, BaseServerError>;

export const cdpErr = (surface: string, error: BaseServerError) =>
  serverErr(type, surface, error);
export const cdpResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: BaseServerError | ((e: unknown) => BaseServerError)
) => serverResultFromPromise(type, surface, promise, error);
