import { useState } from 'react';

import { Mail } from 'lucide-react';

import { useConnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { ConnectEVMInjectedWallet } from './injected/evm';

import { ConnectEmbeddedWalletEmail } from './embedded/email';
import { ConnectEmbeddedWalletOAuth } from './embedded/oauth';

export const ConnectWalletForm = () => {
  const { connectors } = useConnect();

  const [isEmailFlow, setIsEmailFlow] = useState(false);

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  return (
    <>
      {filteredConnectors.length > 0 && !isEmailFlow && (
        <>
          <ConnectEVMInjectedWallet
            connectors={filteredConnectors}
            className="w-full"
            buttonClassName="w-full h-12 md:h-12"
            prefix="Connect"
          />
          <div className="flex items-center gap-2 w-full">
            <Separator className="flex-1" />
            <p className="text-muted-foreground text-xs">or</p>
            <Separator className="flex-1" />
          </div>
        </>
      )}
      {filteredConnectors.length === 0 || isEmailFlow ? (
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
      {isEmailFlow && filteredConnectors.length > 0 && (
        <Button onClick={() => setIsEmailFlow(false)} variant="ghost">
          Back
        </Button>
      )}
    </>
  );
};
