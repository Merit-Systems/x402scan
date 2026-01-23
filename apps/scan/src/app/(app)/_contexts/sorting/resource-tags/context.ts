'use client';

import { createSortingContext } from '../base/context';

import type { ResourceSortId } from '@/services/db/resources/resource';

export const ResourcesSortingContext = createSortingContext<ResourceSortId>();
