'use client';

import { createSortingContext } from '../base/context';

import type { TransfersSortId } from '@/services/cdp/sql/transfers/list';

export const TransfersSortingContext = createSortingContext<TransfersSortId>();
