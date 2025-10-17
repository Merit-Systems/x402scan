import { env } from '@/env';
import type { Config } from '@coinbase/cdp-hooks';

export const cdpConfig: Config = {
  projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID!,
  ethereum: {
    createOnLogin: 'eoa' as const,
  },
  solana: {},
};
