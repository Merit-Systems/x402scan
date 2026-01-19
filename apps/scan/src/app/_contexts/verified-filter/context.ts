'use client';

import { createContext } from 'react';

export interface VerifiedFilterContextType {
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
}

export const VerifiedFilterContext =
  createContext<VerifiedFilterContextType | null>(null);
