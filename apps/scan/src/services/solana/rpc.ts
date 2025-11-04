import { createSolanaRpc } from '@solana/kit';

import { env } from '@/env';

export const solanaRpc = createSolanaRpc(env.NEXT_PUBLIC_SOLANA_RPC_URL!);
