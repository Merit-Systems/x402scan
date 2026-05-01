'use client';

import { useEffect, useState } from 'react';

import { ProtocolContext } from './context';
import {
  getProtocolCookieClient,
  setProtocolCookieClient,
} from './cookies';

import type { SearchProtocol } from '@/features/search-box';

const DEFAULT_PROTOCOL: SearchProtocol = 'x402';

interface Props {
  children: React.ReactNode;
}

export const ProtocolProvider: React.FC<Props> = ({ children }) => {
  const [protocol, setProtocolState] = useState<SearchProtocol | undefined>(
    () => getProtocolCookieClient() ?? DEFAULT_PROTOCOL
  );

  useEffect(() => {
    setProtocolCookieClient(protocol);
  }, [protocol]);

  return (
    <ProtocolContext.Provider value={{ protocol, setProtocol: setProtocolState }}>
      {children}
    </ProtocolContext.Provider>
  );
};
