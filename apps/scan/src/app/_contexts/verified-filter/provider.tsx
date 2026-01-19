'use client';

import { useState } from 'react';

import { VerifiedFilterContext } from './context';

const STORAGE_KEY = 'verified-filter-enabled';

export const VerifiedFilterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Initialize state from localStorage
  const [verifiedOnly, setVerifiedOnlyState] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  // Persist to localStorage when changed
  const setVerifiedOnly = (value: boolean) => {
    setVerifiedOnlyState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return (
    <VerifiedFilterContext.Provider value={{ verifiedOnly, setVerifiedOnly }}>
      {children}
    </VerifiedFilterContext.Provider>
  );
};
