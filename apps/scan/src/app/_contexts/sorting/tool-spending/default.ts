import type { ToolSpendingSortId } from './context';
import type { SortType } from '../base/types';

export const defaultToolSpendingSorting: SortType<ToolSpendingSortId> = {
  id: 'totalMaxAmount',
  desc: true,
};
