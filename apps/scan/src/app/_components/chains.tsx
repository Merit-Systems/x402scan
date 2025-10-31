import Image from 'next/image';

import { CHAIN_ICONS, CHAIN_LABELS } from '@/types/chain';

import { cn } from '@/lib/utils';

import type { Chain } from '@/types/chain';

interface Props {
  chains: Chain[];
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
        <Image
          key={chain}
          src={CHAIN_ICONS[chain]}
          alt={CHAIN_LABELS[chain]}
          width={16}
          height={16}
          className={cn('rounded-md', iconClassName)}
        />
      ))}
    </div>
  );
};
