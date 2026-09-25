import { TextSeparator } from "@/components/ui/text-separator";

import { Onramp } from "./onramp";
import { Send } from "./send";

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
