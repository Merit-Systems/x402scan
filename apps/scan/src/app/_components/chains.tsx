import Image from 'next/image';

import { CHAIN_ICONS, CHAIN_LABELS } from '@/types/chain';

import { cn } from '@/lib/utils';

import type { Chain as ChainType } from '@/types/chain';

interface Props {
  chains: ChainType[];
  className?: string;
  iconClassName?: string;
}
export const Chains: React.FC<Props> = ({
  chains,
  className,
  iconClassName,
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {chains.map(chain => (
        <Chain key={chain} chain={chain} iconClassName={iconClassName} />
      ))}
    </div>
  );
};

export const Chain: React.FC<{ chain: ChainType; iconClassName?: string }> = ({
  chain,
  iconClassName,
}) => {
  return (
    <Image
      key={chain}
      src={CHAIN_ICONS[chain]}
      alt={CHAIN_LABELS[chain]}
      width={64}
      height={64}
      className={cn('rounded-md size-4', iconClassName)}
    />
  );
};
