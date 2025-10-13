'use client';

import { createSortingContext } from '../base/context';

import type { SellerSortId } from '@/services/cdp/sql/sellers/list';

export const SellersSortingContext = createSortingContext<SellerSortId>();
