import type { ToolSortId } from '@/services/db/composer/tool-call';

import type { SortType } from '../base/types';

export const defaultToolsSorting: SortType<ToolSortId> = {
  id: 'toolCalls',
  desc: true,
};
