import { headers } from 'next/headers';

import { cookieToInitialState } from 'wagmi';

import { WagmiProviderClient } from './client';
import { createWagmiConfig } from './config';

interface Props {
  children: React.ReactNode;
}

export const WagmiProvider: React.FC<Props> = async ({ children }) => {
  const initialState = cookieToInitialState(
    createWagmiConfig(),
    (await headers()).get('cookie')
  );
  return (
    <WagmiProviderClient initialState={initialState}>
      {children}
    </WagmiProviderClient>
  );
};
