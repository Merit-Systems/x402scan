'use client';

import { createConfig, WagmiProvider as WagmiProviderBase } from 'wagmi';

import { wagmiConfig } from './config';

import type { State } from 'wagmi';

interface Props {
  children: React.ReactNode;
  initialState: State | undefined;
}

const config = createConfig(wagmiConfig);

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
