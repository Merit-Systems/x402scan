import { resultFromPromise, ok, err } from '@/lib/result';

const surface = 'database';

export const dbOk = ok(surface);
export const dbErr = err(surface);
export const dbResultFromPromise = resultFromPromise(surface);
