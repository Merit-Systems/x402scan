'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface GamedFilterContextType {
  showGamed: boolean;
  setShowGamed: (value: boolean) => void;
}

const GamedFilterContext = createContext<GamedFilterContextType>({
  showGamed: false,
  setShowGamed: () => {
    void 0;
  },
});

export const useGamedFilter = () => {
  return useContext(GamedFilterContext);
};

export const GamedFilterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [showGamed, setShowGamed] = useState(false);

  const value = useMemo(
    () => ({ showGamed, setShowGamed }),
    [showGamed]
  );

  return (
    <GamedFilterContext.Provider value={value}>
      {children}
    </GamedFilterContext.Provider>
  );
};
