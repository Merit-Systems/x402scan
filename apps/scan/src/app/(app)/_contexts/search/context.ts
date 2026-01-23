'use client';

import { createContext } from 'react';

interface SearchContext {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

export const SearchContext = createContext<SearchContext>({
  isOpen: false,
  setIsOpen: () => {
    // do nothing
  },
  search: '',
  setSearch: () => {
    // do nothing
  },
});
