import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { cdpConfig } from '../cdp/config';
import { env } from '@/env';

const cdpEmbeddedWalletConnector = createCDPEmbeddedWalletConnector({
  cdpConfig,
  providerConfig: {
    chains: [base],
    transports: {
      [base.id]: http(),
    },
  },
});

export const wagmiConfig = {
  chains: [base],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: http(env.NEXT_PUBLIC_BASE_RPC_URL),
  },
  connectors: [injected(), cdpEmbeddedWalletConnector],
  ssr: true,
} as const;

export const createWagmiConfig = () => createConfig(wagmiConfig);
