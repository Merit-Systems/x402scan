'use client';

import { createSortingContext } from '../base/context';

import type { ToolSortId } from '@/services/db/composer/tool-call';

export const ToolsSortingContext = createSortingContext<ToolSortId>();
