import { createSolanaRpc } from '@solana/kit';
import { env } from '@/env';

export const solanaRpc = createSolanaRpc(env.SOLANA_RPC_URL!);
