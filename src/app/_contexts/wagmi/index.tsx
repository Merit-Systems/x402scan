import { headers } from 'next/headers';

import { cookieToInitialState } from 'wagmi';

import { WagmiProviderClient } from './client';
import { getServerConfig } from './config';

interface Props {
  children: React.ReactNode;
}

export const WagmiProvider: React.FC<Props> = async ({ children }) => {
  const initialState = cookieToInitialState(
    getServerConfig(),
    (await headers()).get('cookie')
  );
  return (
    <WagmiProviderClient initialState={initialState}>
      {children}
    </WagmiProviderClient>
  );
};
