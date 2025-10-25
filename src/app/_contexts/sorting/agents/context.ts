'use client';

import { createSortingContext } from '../base/context';

import type { AgentSortId } from '@/services/db/agent-config/list';

export const AgentsSortingContext = createSortingContext<AgentSortId>();
