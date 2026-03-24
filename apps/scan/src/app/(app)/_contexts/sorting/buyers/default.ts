import type { BuyerSortId } from '@/services/transfers/buyers/list-mv';

import type { SortType } from '../base/types';

export const defaultBuyersSorting: SortType<BuyerSortId> = {
  id: 'tx_count',
  desc: true,
};
