'use client';

import { createConfig, WagmiProvider as WagmiProviderBase, http } from 'wagmi';
import { base } from 'wagmi/chains';

import { cdpEmbeddedWalletConnector } from './cdp';
import { injected } from 'wagmi/connectors';

interface Props {
  children: React.ReactNode;
}

const wagmiConfig = createConfig({
  connectors: [injected(), cdpEmbeddedWalletConnector],
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

export const WagmiProvider = ({ children }: Props) => {
  return <WagmiProviderBase config={wagmiConfig}>{children}</WagmiProviderBase>;
};
