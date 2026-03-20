'use client';

import { createContext, useContext, useState } from 'react';

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

  return (
    <SpeculativeFilterContext.Provider
      value={{ showSpeculative, setShowSpeculative }}
    >
      {children}
    </SpeculativeFilterContext.Provider>
  );
};
