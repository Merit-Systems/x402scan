'use client';

import { createContext } from 'react';

import type { SearchProtocol } from '@/features/search-box';

interface ProtocolContextType {
  protocol: SearchProtocol | undefined;
  setProtocol: (protocol: SearchProtocol | undefined) => void;
}

export const ProtocolContext = createContext<ProtocolContextType>({
  protocol: undefined,
  setProtocol: () => {
    void 0;
  },
});
