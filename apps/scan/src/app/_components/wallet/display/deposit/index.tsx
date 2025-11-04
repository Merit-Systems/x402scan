import { Separator } from '@/components/ui/separator';

import { Send } from './send';
import { Onramp } from './onramp';

import type { Address } from 'viem';

interface Props {
  address: Address;
}

export const Deposit: React.FC<Props> = ({ address }) => {
  return (
    <div className="flex flex-col gap-4">
      <Send address={address} />
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <p className="text-muted-foreground text-xs">or</p>
        <Separator className="flex-1" />
      </div>
      <Onramp />
    </div>
  );
};
