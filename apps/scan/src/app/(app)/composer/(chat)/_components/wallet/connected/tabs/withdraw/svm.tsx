import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSolanaWallet } from "@/app/_contexts/solana/hook";

import { useSvmSend } from "@/app/(app)/composer/_hooks/send/use-svm-send";

import type { UiWalletAccount } from "@wallet-standard/react";
import type { SolanaAddress } from "@/types/address";
import { solanaAddressSchema } from "@/lib/schemas";

interface Props {
  amount: number;
  toAddress: string;
  onSuccess: () => void;
}

export const WithdrawSolana: React.FC<Props> = ({
  amount,
  toAddress,
  onSuccess,
}) => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return <div>Connect your wallet to withdraw USDC</div>;
  }
  const parsedAddress = solanaAddressSchema.safeParse(toAddress);
  if (!parsedAddress.success) {
    return <Button disabled>Invalid Solana address</Button>;
  }

  return (
    <WithdrawSolanaContent
      account={connectedWallet.account}
      amount={amount}
      onSuccess={onSuccess}
      toAddress={parsedAddress.data}
    />
  );
};

interface WithdrawContentProps {
  account: UiWalletAccount;
  amount: number;
  toAddress: SolanaAddress;
  onSuccess: () => void;
}

const WithdrawSolanaContent: React.FC<WithdrawContentProps> = ({
  account,
  amount,
  toAddress,
  onSuccess,
}) => {
  const { handleSubmit, isPending, isInvalid, statusText, isSent } = useSvmSend(
    {
      account,
      amount: amount,
      address: toAddress,
      onSuccess,
    }
  );

  return (
    <Button
      variant="default"
      disabled={isInvalid || isPending}
      onClick={handleSubmit}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSent ? (
        <Check className="size-4" />
      ) : null}
      {statusText}
    </Button>
  );
};
