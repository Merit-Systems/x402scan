import type { SortType } from '../base/types';
import type { TransfersSortId } from '@/services/cdp/sql/transfers/list';

export const defaultTransfersSorting: SortType<TransfersSortId> = {
  id: 'block_timestamp',
  desc: true,
};
