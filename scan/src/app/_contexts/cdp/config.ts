import { env } from '@/env';
import type { Config } from '@coinbase/cdp-hooks';
import { http } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

export const cdpConfig: Config = {
  projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID!,
  ethereum: {
    createOnLogin: 'eoa' as const,
  },
  solana: {
    createOnLogin: true,
  },
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
};
