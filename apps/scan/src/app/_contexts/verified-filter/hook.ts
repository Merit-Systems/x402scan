'use client';

import { useContext } from 'react';

import { VerifiedFilterContext } from './context';

export const useVerifiedFilter = () => {
  const context = useContext(VerifiedFilterContext);
  if (!context) {
    throw new Error(
      'useVerifiedFilter must be used within VerifiedFilterProvider'
    );
  }
  return context;
};
