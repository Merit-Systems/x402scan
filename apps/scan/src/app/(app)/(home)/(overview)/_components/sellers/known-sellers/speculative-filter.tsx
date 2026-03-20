'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface SpeculativeFilterContextType {
  showSpeculative: boolean;
  setShowSpeculative: (value: boolean) => void;
}

const SpeculativeFilterContext = createContext<SpeculativeFilterContextType>({
  showSpeculative: false,
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
  const [showSpeculative, setShowSpeculative] = useState(false);

  const value = useMemo(
    () => ({ showSpeculative, setShowSpeculative }),
    [showSpeculative]
  );

  return (
    <SpeculativeFilterContext.Provider value={value}>
      {children}
    </SpeculativeFilterContext.Provider>
  );
};
