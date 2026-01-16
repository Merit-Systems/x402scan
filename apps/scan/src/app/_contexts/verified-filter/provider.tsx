'use client';

import { useState, useEffect } from 'react';

import { VerifiedFilterContext } from './context';

const STORAGE_KEY = 'verified-filter-enabled';

export const VerifiedFilterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [verifiedOnly, setVerifiedOnlyState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setVerifiedOnlyState(stored === 'true');
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage when changed
  const setVerifiedOnly = (value: boolean) => {
    setVerifiedOnlyState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  // Don't render children until we've loaded the state
  if (!isLoaded) {
    return null;
  }

  return (
    <VerifiedFilterContext.Provider value={{ verifiedOnly, setVerifiedOnly }}>
      {children}
    </VerifiedFilterContext.Provider>
  );
};
