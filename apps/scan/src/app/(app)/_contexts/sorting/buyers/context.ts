'use client';

import { createSortingContext } from '../base/context';

import type { BuyerSortId } from '@/services/transfers/buyers/list-mv';

export const BuyersSortingContext = createSortingContext<BuyerSortId>();
