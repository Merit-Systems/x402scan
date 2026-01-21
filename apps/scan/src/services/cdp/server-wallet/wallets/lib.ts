import { resultFromPromise, err } from '@/lib/result';

import type { ResultAsync, Error } from '@/types/result';

const surface = 'cdp';

export type CdpResultAsync<T> = ResultAsync<T, typeof surface>;
export type CdpError = Error<typeof surface>;

// export const cdpOk = ok(surface);
export const cdpErr = err(surface);
export const cdpResultFromPromise = resultFromPromise(surface);
