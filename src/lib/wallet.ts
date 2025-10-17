import { headers } from 'next/headers';

import { cookieToInitialState } from 'wagmi';

import { getServerConfig } from '@/app/_contexts/wagmi/config';

export const getWalletsFromHeaders = async () => {
  const initialState = cookieToInitialState(
    getServerConfig(),
    (await headers()).get('cookie')
  );

  if (!initialState) {
    return null;
  }

  const connections = Array.from(initialState.connections.values());
  return connections.flatMap(connection => connection.accounts);
};
