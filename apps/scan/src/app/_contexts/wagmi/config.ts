import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from 'wagmi';
import { base } from 'wagmi/chains';

import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';

import { cdpConfig } from '../cdp/config';

import { env } from '@/env';

const createCDPConnector = () =>
  createCDPEmbeddedWalletConnector({
    cdpConfig,
    providerConfig: {
      chains: [base],
      transports: {
        [base.id]: http(),
      },
    },
  });

export const createWagmiConfig = () => {
  const isServer = typeof window === 'undefined';

  return createConfig({
    chains: [base],
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [base.id]: http(env.NEXT_PUBLIC_BASE_RPC_URL),
    },
    connectors: isServer ? [injected()] : [injected(), createCDPConnector()],
    ssr: true,
  });
};
