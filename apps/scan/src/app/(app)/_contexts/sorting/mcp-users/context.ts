'use client';

import { createSortingContext } from '../base/context';

import type { McpUserSortId } from './types';

export const McpUsersSortingContext = createSortingContext<McpUserSortId>();
