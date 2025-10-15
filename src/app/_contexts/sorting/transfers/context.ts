'use client';

import { createSortingContext } from '../base/context';

import type { TransfersSortId } from '@/services/indexer/transfers/list';

export const TransfersSortingContext = createSortingContext<TransfersSortId>();
