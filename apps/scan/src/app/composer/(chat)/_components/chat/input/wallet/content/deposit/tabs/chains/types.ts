import type { DepositTab } from '../types';
import type { SupportedChain } from '@/types/chain';

export interface DepositTabsProps<T extends SupportedChain = SupportedChain> {
  chain: T;
  onSuccess?: () => void;
  tab: DepositTab;
  setTab: (tab: DepositTab) => void;
}
