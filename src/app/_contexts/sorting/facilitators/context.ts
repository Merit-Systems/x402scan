'use client';

import { createSortingContext } from '../base/context';

import type { FacilitatorsSortId } from '@/services/transfers/facilitators/list';

export const FacilitatorsSortingContext =
  createSortingContext<FacilitatorsSortId>();
