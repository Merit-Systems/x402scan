import type { WalletSpendingSortId } from './context';
import type { SortType } from '../base/types';

export const defaultWalletSpendingSorting: SortType<WalletSpendingSortId> = {
  id: 'totalMaxAmount',
  desc: true,
};
