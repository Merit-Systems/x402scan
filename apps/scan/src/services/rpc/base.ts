import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

import { env } from '@/env';

export const baseRpc = createPublicClient({
  chain: base,
  transport: http(env.NEXT_PUBLIC_BASE_RPC_URL),
});
