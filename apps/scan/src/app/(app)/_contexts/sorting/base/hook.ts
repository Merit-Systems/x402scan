'use client';

import { useContext } from 'react';

import type { Context } from 'react';
import type { SortingContextType } from './context';

export const useSorting = <SortKey extends string>(
  context: Context<SortingContextType<SortKey>>
) => {
  return useContext(context);
};
