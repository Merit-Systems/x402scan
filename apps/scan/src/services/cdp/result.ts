import {
  serverResultFromPromise,
  serverErr,
} from '@x402scan/neverthrow/server';

import type {
  ServerResultAsync,
  ServerError,
} from '@x402scan/neverthrow/types';

const surface = 'cdp';

export type CdpResultAsync<T> = ServerResultAsync<T, typeof surface>;
export type CdpError = ServerError<typeof surface>;

export const cdpErr = serverErr(surface);
export const cdpResultFromPromise = serverResultFromPromise(surface);
