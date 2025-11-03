import { useState } from 'react';

import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { ConnectEVMInjectedWalletForm } from './injected/form/evm';
import { ConnectSVMInjectedWalletForm } from './injected/form/svm';

import { ConnectEmbeddedWalletEmail } from './embedded/email';
import { ConnectEmbeddedWalletOAuth } from './embedded/oauth';
import { useWalletChain } from '../chain-context/hook';
import { Chain } from '@/types/chain';

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
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setIsEmailFlow(true)}
            className="w-full h-12 md:h-12"
            variant="outline"
          >
            <Mail className="size-4" />
            Continue with Email
          </Button>
          <ConnectEmbeddedWalletOAuth />
        </div>
      )}
      {isEmailFlow && (
        <Button onClick={() => setIsEmailFlow(false)} variant="ghost">
          Back
        </Button>
      )}
    </>
  );
};
