'use client';

import { createSortingContext } from '../base/context';

import type { SellerSortId } from '@/services/indexer/sellers/list';

export const SellersSortingContext = createSortingContext<SellerSortId>();
