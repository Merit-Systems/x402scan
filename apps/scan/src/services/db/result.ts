import {
  serverResultFromPromise,
  serverErr,
  serverOk,
} from '@x402scan/neverthrow/server';

const surface = 'database';

export const dbOk = serverOk(surface);
export const dbErr = serverErr(surface);
export const dbResultFromPromise = serverResultFromPromise(surface);
