'use client';

import { createSortingContext } from '../base/context';

export type ToolSpendingSortId =
  | 'resourceUrl'
  | 'totalToolCalls'
  | 'uniqueWallets'
  | 'totalMaxAmount'
  | 'lastUsedAt';

export const ToolSpendingSortingContext =
  createSortingContext<ToolSpendingSortId>();
