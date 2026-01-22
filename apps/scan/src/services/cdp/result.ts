import {
  serverResultFromPromise,
  serverErr,
} from '@x402scan/neverthrow/server';

import type {
  ServerResultAsync,
  ServerError,
  BaseServerError,
} from '@x402scan/neverthrow/types';

const surface = 'cdp';

export type CdpResultAsync<T> = ServerResultAsync<T>;
export type CdpError = ServerError;

export const cdpErr = (error: Parameters<typeof serverErr>[1]) =>
  serverErr(surface, error);
export const cdpResultFromPromise = <T>(
  promise: Promise<T>,
  error: (e: unknown) => BaseServerError
) => serverResultFromPromise(surface, promise, error);
