'use client';

import { WagmiProvider as WagmiProviderBase } from 'wagmi';

import { createWagmiConfig } from './config';

import type { State } from 'wagmi';

type Props = {
  children: React.ReactNode;
  initialState: State | undefined;
};

const wagmiConfig = createWagmiConfig();

export const WagmiProviderClient: React.FC<Props> = ({
  children,
  initialState,
}) => {
  return (
    <WagmiProviderBase config={wagmiConfig} initialState={initialState}>
      {children}
    </WagmiProviderBase>
  );
};
