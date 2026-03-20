import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from 'wagmi';
import { abstract, base } from 'wagmi/chains';

import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';

import { cdpConfig } from '../cdp/config';

import { env } from '@/env';

const createCDPConnector = () =>
  createCDPEmbeddedWalletConnector({
    cdpConfig,
    providerConfig: {
      chains: [abstract, base],
      transports: {
        [abstract.id]: http(),
        [base.id]: http(),
      },
    },
  });

export const createWagmiConfig = () => {
  const isServer = typeof window === 'undefined';

  return createConfig({
    chains: [abstract, base],
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [abstract.id]: http(),
      [base.id]: http(env.NEXT_PUBLIC_BASE_RPC_URL),
    },
    connectors: isServer ? [injected()] : [injected(), createCDPConnector()],
    ssr: true,
  });
};
