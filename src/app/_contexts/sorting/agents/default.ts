import type { AgentSortId } from '@/services/db/agent-config/list';

import type { SortType } from '../base/types';

export const defaultAgentsSorting: SortType<AgentSortId> = {
  id: 'message_count',
  desc: true,
};
