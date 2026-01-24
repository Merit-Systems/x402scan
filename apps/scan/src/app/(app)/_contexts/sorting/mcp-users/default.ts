import type { McpUserSortId } from './types';

import type { SortType } from '../base/types';

export const defaultMcpUsersSorting: SortType<McpUserSortId> = {
  id: 'lastRedemption',
  desc: true,
};
