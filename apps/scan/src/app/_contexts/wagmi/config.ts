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
import { baseAccount } from 'wagmi/connectors';

const cdpEmbeddedWalletConnector = createCDPEmbeddedWalletConnector({
  cdpConfig,
  providerConfig: {
    chains: [base],
    transports: {
      [base.id]: http(),
    },
  },
});

const baseAccountConnector = (() => {
  const connector = baseAccount({
    appName: 'x402scan',
    appLogoUrl: 'https://www.x402scan.com/logo.svg',
  });

  // Wrap the connector to add icon property
  return (config: Parameters<ReturnType<typeof baseAccount>>[0]) => {
    const result = connector(config);
    return {
      ...result,
      icon: '/baseAccount.png',
    };
  };
})();

export const wagmiConfig = {
  chains: [base],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: http(),
  },
  connectors: [injected(), cdpEmbeddedWalletConnector, baseAccountConnector],
  ssr: true,
} as const;

export const getServerConfig = () =>
  createConfig({
    ...wagmiConfig,
  });
