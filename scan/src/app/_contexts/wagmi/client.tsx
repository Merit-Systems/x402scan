'use client';

import { createConfig, http, WagmiProvider as WagmiProviderBase } from 'wagmi';

import { baseWagmiConfig } from './config';

import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';
import { cdpConfig } from '../cdp/config';
import { base } from 'wagmi/chains';

import type { State } from 'wagmi';
import { useState } from 'react';

interface Props {
  children: React.ReactNode;
  initialState: State | undefined;
}

const cdpEmbeddedWalletConnector = createCDPEmbeddedWalletConnector({
  cdpConfig,
  providerConfig: {
    chains: [base],
    transports: {
      [base.id]: http(),
    },
  },
});

const getClientConfig = () =>
  createConfig({
    ...baseWagmiConfig,
    chains: baseWagmiConfig.chains,
    connectors: [...baseWagmiConfig.connectors, cdpEmbeddedWalletConnector],
  });

export const WagmiProviderClient: React.FC<Props> = ({
  children,
  initialState,
}) => {
  const [config] = useState(() => getClientConfig());

  return (
    <WagmiProviderBase config={config} initialState={initialState}>
      {children}
    </WagmiProviderBase>
  );
};
