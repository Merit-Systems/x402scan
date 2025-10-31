import { Chain, CHAIN_LABELS, CHAIN_ICONS } from '@/types/chain';

const NETWORK_COLORS: Record<Chain, string> = {
  [Chain.BASE]: 'hsl(221, 83%, 53%)',
  [Chain.SOLANA]: 'hsl(271, 100%, 71%)',
  [Chain.POLYGON]: 'hsl(272, 55%, 50%)',
  [Chain.OPTIMISM]: 'hsl(0, 91%, 71%)',
};

export const networks = Object.values(Chain).map(chain => ({
  chain,
  name: CHAIN_LABELS[chain],
  icon: CHAIN_ICONS[chain],
  color: NETWORK_COLORS[chain],
}));

type TabConfig<T extends Record<string, number>> = {
  trigger: {
    label: string;
    value: string;
    amount: string;
  };
  items: {
    type: 'bar';
    bars: Array<{
      dataKey: keyof T;
      name: string;
      color: string;
    }>;
    solid?: boolean;
    stackOffset?: 'expand' | 'none';
  };
  tooltipRows: Array<{
    key: keyof T;
    label: string;
    getValue: (data: number, allData: T) => string;
    labelClassName?: string;
    valueClassName?: string;
    dotColor: string;
  }>;
};

type Item = {
  name: string;
  color: string;
};

type CreateTabOptions<T extends Record<string, number>, TItem extends Item> = {
  label: string;
  stackOffset?: 'expand' | 'none';
  amount: string;
  items: TItem[];
  getKey: (item: TItem) => string;
  getValue: (data: number, dataType: string, allData: T) => string;
};

export function createTab<T extends Record<string, number>, TItem extends Item>(
  options: CreateTabOptions<T, TItem>
): TabConfig<T> {
  const dataType = options.label.toLowerCase();
  const getKey = options.getKey;

  return {
    trigger: {
      label: options.label,
      value: dataType,
      amount: options.amount,
    },
    items: {
      type: 'bar',
      bars: options.items.toReversed().map(item => ({
        dataKey: `${getKey(item)}-${dataType}` as keyof T,
        name: item.name,
        color: item.color,
      })),
      solid: true,
      stackOffset: options.stackOffset,
    },
    tooltipRows: options.items.map(item => ({
      key: `${getKey(item)}-${dataType}` as keyof T,
      label: item.name,
      getValue: (data: number, allData: T) =>
        options.getValue(data, dataType, allData),
      labelClassName: 'text-xs font-mono',
      valueClassName: 'text-xs font-mono',
      dotColor: item.color,
    })),
  };
}
