import { Loader2 } from 'lucide-react';

import { useConnect } from 'wagmi';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import type { Connector } from 'wagmi';

interface Props {
  connector: Connector;
}

export const ConnectButton: React.FC<Props> = ({ connector }) => {
  const queryClient = useQueryClient();

  const { connect, isPending } = useConnect({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['is-connected', connector.id],
        });
      },
    },
  });

  return (
    <Button onClick={() => connect({ connector })} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Connect'}
    </Button>
  );
};
