import { TextSeparator } from '@/components/ui/text-separator';

import { Send } from './send';
import { Onramp } from './onramp';

interface Props {
  address: string;
}

export const Deposit: React.FC<Props> = ({ address }) => {
  return (
    <div className="flex flex-col gap-4">
      <Send address={address} />
      <TextSeparator text="or" />
      <Onramp />
    </div>
  );
};
