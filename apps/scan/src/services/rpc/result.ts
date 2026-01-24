import { serverResultFromPromise } from '@/lib/server-result';

import type { BaseServerError } from '@/lib/server-result';

const type = 'rpc';

export const rpcResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: BaseServerError | ((e: unknown) => BaseServerError)
) => serverResultFromPromise(type, surface, promise, error);
