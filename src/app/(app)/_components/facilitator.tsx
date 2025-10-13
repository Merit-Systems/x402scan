import Image from 'next/image';

import { Address } from '@/components/ui/address';
import { facilitatorAddressMap } from '@/lib/facilitators';

import { cn } from '@/lib/utils';

import type { FacilitatorAddress } from '@/lib/facilitators';

interface Props {
  address: FacilitatorAddress;
  className?: string;
}

export const Facilitator: React.FC<Props> = ({ address, className }) => {
  const facilitator = facilitatorAddressMap.get(address);

  if (!facilitator) {
    return <Address address={address} className={className} />;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Image
        src={facilitator?.image}
        alt={facilitator?.name}
        width={16}
        height={16}
        className="rounded-md"
      />
      <p className="text-[10px] md:text-xs font-semibold">{facilitator.name}</p>
    </div>
  );
};

interface FacilitatorsProps {
  addresses: FacilitatorAddress[];
  className?: string;
}

export const Facilitators: React.FC<FacilitatorsProps> = ({
  addresses,
  className,
}) => {
  if (addresses.length === 1) {
    return <Facilitator address={addresses[0]} className={className} />;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {addresses.map(address => {
          const facilitator = facilitatorAddressMap.get(address);
          if (!facilitator) {
            return null;
          }
          return (
            <Image
              key={address}
              src={facilitator.image}
              alt={facilitator.name}
              width={16}
              height={16}
              className="rounded-md"
            />
          );
        })}
      </div>
      <p className="text-[10px] md:text-xs font-semibold">
        {addresses.length} facilitators
      </p>
    </div>
  );
};
