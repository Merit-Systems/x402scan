'use client';

import { createSortingContext } from '../base/context';

import type { FacilitatorsSortId } from '@/services/cdp/sql/facilitators/list';

export const FacilitatorsSortingContext =
  createSortingContext<FacilitatorsSortId>();
