import type { SellerSortId } from '@/services/indexer/sellers/list';

import type { SortType } from '../base/types';

export const defaultSellersSorting: SortType<SellerSortId> = {
  id: 'tx_count',
  desc: true,
};
