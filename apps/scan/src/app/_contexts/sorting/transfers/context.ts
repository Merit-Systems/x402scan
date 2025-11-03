'use client';

import { createSortingContext } from '../base/context';

import type { TransfersSortId } from '@/services/transfers/transfers/list';

export const TransfersSortingContext = createSortingContext<TransfersSortId>();
