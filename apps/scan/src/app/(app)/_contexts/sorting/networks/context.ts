'use client';

import { createSortingContext } from '../base/context';

import type { NetworksSortId } from '@/services/transfers/networks/list';

export const NetworksSortingContext = createSortingContext<NetworksSortId>();
