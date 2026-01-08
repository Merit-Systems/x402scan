'use client';

import * as React from 'react';

import type { SortType } from './types';
import type { Context } from 'react';

interface SortingContextValue<SortKey extends string> {
  sorting: SortType<SortKey>;
  setSorting: (sorting: SortType<SortKey>) => void;
}

export type SortingContextType<SortKey extends string> =
  | SortingContextValue<SortKey>
  | undefined;

export type SortingContext<SortKey extends string> = Context<
  SortingContextType<SortKey>
>;

export function createSortingContext<SortKey extends string>() {
  return React.createContext<SortingContextType<SortKey>>(undefined);
}
