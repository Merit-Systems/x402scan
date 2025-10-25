import type { SortType } from '../base/types';
import type { NetworksSortId } from '@/services/transfers/networks/list';

export const defaultNetworksSorting: SortType<NetworksSortId> = {
  id: 'tx_count',
  desc: true,
};
