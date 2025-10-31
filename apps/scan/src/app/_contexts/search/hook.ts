'use client';

import { useContext } from 'react';

import { SearchContext } from './context';

export const useSearch = () => {
  return useContext(SearchContext);
};
