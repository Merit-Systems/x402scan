import { useState } from "react";

import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ConnectEVMInjectedWalletForm } from "./injected/form/evm";
import { ConnectSVMInjectedWalletForm } from "./injected/form/svm";

import { ConnectEmbeddedWalletEmail } from "./embedded/email";
import { ConnectEmbeddedWalletOAuth } from "./embedded/oauth";
import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";
import { Chain } from "@/types/chain";

export const ConnectWalletForm = () => {
  const { chain } = useWalletChain();

  const [isEmailFlow, setIsEmailFlow] = useState(false);

  return (
    <>
      {chain === Chain.SOLANA ? (
        <ConnectSVMInjectedWalletForm />
      ) : (
        <ConnectEVMInjectedWalletForm />
      )}
      {isEmailFlow ? (
        <ConnectEmbeddedWalletEmail />
      ) : (
        <div className="flex w-full flex-col gap-2">
          <ConnectEmbeddedWalletOAuth />
          <Button
            onClick={() => {
              setIsEmailFlow(true);
            }}
            className="w-full"
            variant="outline"
            type="button"
          >
            <Mail className="size-4" />
            Continue with Email
          </Button>
        </div>
      )}
      {isEmailFlow && (
        <Button
          onClick={() => {
            setIsEmailFlow(false);
          }}
          variant="ghost"
          type="button"
        >
          Back
        </Button>
      )}
    </>
  );
};
