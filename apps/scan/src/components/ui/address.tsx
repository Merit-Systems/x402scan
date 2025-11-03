'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

import { Copyable } from './copyable';

import { cn, formatAddress } from '@/lib/utils';

interface Props {
  address: string;
  className?: string;
  hideTooltip?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  disableCopy?: boolean;
  showLink?: boolean;
}

export const Address: React.FC<Props> = ({
  address,
  className,
  hideTooltip,
  side,
  disableCopy,
}) => {
  const formattedAddress = formatAddress(address);

  if (disableCopy) {
    return (
      <span className={cn('font-mono text-xs', className)}>
        {formattedAddress}
      </span>
    );
  }
  const addressComponent = (
    <Copyable value={address} className={cn('font-mono text-xs', className)}>
      {formattedAddress}
    </Copyable>
  );

  if (hideTooltip) {
    return addressComponent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{addressComponent}</TooltipTrigger>
      <TooltipContent side={side}>
        <p className="font-mono">{address}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface AddressesProps extends Omit<Props, 'address'> {
  addresses: string[];
}

export const Addresses = ({
  addresses,
  className,
  hideTooltip,
  side,
  disableCopy,
}: AddressesProps) => {
  if (addresses.length === 1) {
    return (
      <Address
        address={addresses[0]}
        className={cn('border-none p-0', className)}
        hideTooltip={hideTooltip}
        side={side}
        disableCopy={disableCopy}
      />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          'cursor-pointer hover:bg-muted hover:text-muted-foreground rounded-md transition-colors text-xs font-mono',
          className
        )}
      >
        {addresses.length} address{addresses.length === 1 ? '' : 'es'}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm flex flex-col gap-1" side={side}>
        <p>
          An origin can be associated with multiple addresses.
          <br />
          This origin is associated with the following addresses:
        </p>
        <ul className="list-disc list-inside max-h-40 overflow-y-auto">
          {addresses.map(address => (
            <li key={address}>
              <Address
                address={address}
                className="border-none p-0"
                hideTooltip
              />
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};
