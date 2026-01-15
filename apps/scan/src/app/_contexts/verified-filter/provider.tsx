'use client';

import { useState } from 'react';

import { VerifiedFilterContext } from './context';

export const VerifiedFilterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  return (
    <VerifiedFilterContext.Provider value={{ verifiedOnly, setVerifiedOnly }}>
      {children}
    </VerifiedFilterContext.Provider>
  );
};
