'use client';

import { createSortingContext } from '../base/context';

export type ResourceSearchSortId =
  | 'filterMatches'
  | 'title'
  | 'usage'
  | 'performance';

export const ResourceSearchSortingContext =
  createSortingContext<ResourceSearchSortId>();
