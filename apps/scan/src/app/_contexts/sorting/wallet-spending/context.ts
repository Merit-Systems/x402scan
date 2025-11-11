'use client';

import { createSortingContext } from '../base/context';

export type WalletSpendingSortId =
  | 'walletName'
  | 'totalToolCalls'
  | 'uniqueResources'
  | 'totalMaxAmount';

export const WalletSpendingSortingContext =
  createSortingContext<WalletSpendingSortId>();
