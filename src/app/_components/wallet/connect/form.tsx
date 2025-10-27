import { Mail } from 'lucide-react';

import { ConnectEOAForm } from './eoa';
import { ConnectEmbeddedWalletForm } from './embedded';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useConnect } from 'wagmi';
import { useState } from 'react';

export const ConnectWalletForm = () => {
  const { connectors } = useConnect();

  const [isEmbeddedWallet, setIsEmbeddedWallet] = useState(false);

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  return (
    <>
      {filteredConnectors.length > 0 && !isEmbeddedWallet && (
        <>
          <ConnectEOAForm
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
      {filteredConnectors.length === 0 || isEmbeddedWallet ? (
        <ConnectEmbeddedWalletForm />
      ) : (
        <Button
          onClick={() => setIsEmbeddedWallet(true)}
          className="w-full h-12 md:h-12"
          variant="outline"
        >
          <Mail className="size-4" />
          Continue with Email
        </Button>
      )}
      {isEmbeddedWallet && filteredConnectors.length > 0 && (
        <Button onClick={() => setIsEmbeddedWallet(false)} variant="ghost">
          Back
        </Button>
      )}
    </>
  );
};
