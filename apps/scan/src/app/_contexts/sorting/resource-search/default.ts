import type { ResourceSearchSortId } from './context';

import type { SortType } from '../base/types';

export const defaultResourceSearchSorting: SortType<ResourceSearchSortId> = {
  id: 'filterMatches',
  desc: true,
};
