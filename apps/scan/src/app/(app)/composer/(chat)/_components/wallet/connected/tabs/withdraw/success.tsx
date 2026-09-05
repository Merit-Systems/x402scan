import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Props {
  amount: number;
  toAddress: string;
  onReset: () => void;
}

export const WithdrawSuccess: React.FC<Props> = ({
  amount,
  toAddress,
  onReset,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <CheckCircle className="size-10 text-success" />
      <p className="text-center">
        You have successfully sent{" "}
        <span className="type-supporting-body type-emphasis">
          {amount} USDC
        </span>{" "}
        to{" "}
        <span className="type-supporting-body type-emphasis">
          {formatAddress(toAddress)}
        </span>
      </p>
      <Button onClick={onReset}>Send Again</Button>
    </div>
  );
};
