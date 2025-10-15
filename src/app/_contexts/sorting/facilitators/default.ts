import type { SortType } from '../base/types';
import type { FacilitatorsSortId } from '@/services/indexer/facilitators/list';

export const defaultFacilitatorsSorting: SortType<FacilitatorsSortId> = {
  id: 'tx_count',
  desc: true,
};
