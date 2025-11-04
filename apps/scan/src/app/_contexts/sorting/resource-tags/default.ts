import type { ResourceSortId } from '@/services/db/resources/resource';

import type { SortType } from '../base/types';

export const defaultResourcesSorting: SortType<ResourceSortId> = {
  id: 'toolCalls',
  desc: true,
};
