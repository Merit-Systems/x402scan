'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface SpeculativeFilterContextType {
  showGamed: boolean;
  setShowSpeculative: (value: boolean) => void;
}

const SpeculativeFilterContext = createContext<SpeculativeFilterContextType>({
  showGamed: false,
  setShowSpeculative: () => {
    void 0;
  },
});

export const useSpeculativeFilter = () => {
  return useContext(SpeculativeFilterContext);
};

export const SpeculativeFilterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [showGamed, setShowSpeculative] = useState(false);

  const value = useMemo(
    () => ({ showGamed, setShowSpeculative }),
    [showGamed]
  );

  return (
    <SpeculativeFilterContext.Provider value={value}>
      {children}
    </SpeculativeFilterContext.Provider>
  );
};
