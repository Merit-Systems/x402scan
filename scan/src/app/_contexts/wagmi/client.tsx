'use client';

import { createConfig, http, WagmiProvider as WagmiProviderBase } from 'wagmi';

import { baseWagmiConfig } from './config';

import type { State } from 'wagmi';
import { useState } from 'react';
import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';
import { cdpConfig } from '../cdp/config';
import { base } from 'wagmi/chains';

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

const config = createConfig({
  ...baseWagmiConfig,
  connectors: [...baseWagmiConfig.connectors, cdpEmbeddedWalletConnector],
});

export const WagmiProviderClient: React.FC<Props> = ({
  children,
  initialState,
}) => {
  return (
    <WagmiProviderBase config={config} initialState={initialState}>
      {children}
    </WagmiProviderBase>
  );
};
