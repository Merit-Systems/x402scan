'use client';

import { createSortingContext } from '../base/context';

import type { SellerSortId } from '@/services/transfers/sellers/list-mv';

export const SellersSortingContext = createSortingContext<SellerSortId>();
