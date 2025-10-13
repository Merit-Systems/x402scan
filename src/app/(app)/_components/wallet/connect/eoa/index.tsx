import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Connector } from 'wagmi';
import { useConnect } from 'wagmi';
import { base } from 'wagmi/chains';

export const ConnectEOAForm = ({ connectors }: { connectors: Connector[] }) => {
  return (
    <div className="flex flex-col gap-2">
      {connectors.map(connector => (
        <ConnectEOAButton key={connector.id} connector={connector} />
      ))}
    </div>
  );
};

const ConnectEOAButton = ({ connector }: { connector: Connector }) => {
  const { connectAsync, isPending } = useConnect();

  const onConnect = useCallback(
    async (connector: Connector) => {
      await connectAsync(
        { connector, chainId: base.id },
        {
          onSuccess: () => {
            void toast.success('Connected to wallet');
          },
          onError: error => {
            console.error(error);
            void toast.error(error.message);
          },
        }
      );
    },
    [connectAsync]
  );

  return (
    <Button
      variant="outline"
      className="user-message w-full"
      onClick={() => onConnect(connector)}
      disabled={isPending}
    >
      {connector.icon && !isPending && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={connector.icon} alt={connector.name} className="size-4" />
      )}
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {connector.name}
    </Button>
  );
};
