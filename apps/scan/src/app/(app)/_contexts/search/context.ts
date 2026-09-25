"use client";

import { createContext } from "react";

interface SearchContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

export const SearchContext = createContext<SearchContextValue>({
  isOpen: false,
  setIsOpen: () => {
    // do nothing
  },
  search: "",
  setSearch: () => {
    // do nothing
  },
});
