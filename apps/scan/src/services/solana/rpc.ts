import { createSolanaRpc } from '@solana/kit';

import { env } from '@/env';

console.log('env.NEXT_PUBLIC_SOLANA_RPC_URL', env.NEXT_PUBLIC_SOLANA_RPC_URL);

export const solanaRpc = createSolanaRpc(env.NEXT_PUBLIC_SOLANA_RPC_URL!);
