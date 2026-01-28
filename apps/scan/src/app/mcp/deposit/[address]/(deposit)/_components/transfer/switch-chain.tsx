import { Loader2 } from 'lucide-react';

import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import { CHAIN_ID } from '@/types/chain';

import type { Connector } from 'wagmi';
import type { Chain } from '@/types/chain';

interface Props {
  connector: Connector;
  targetChain: Chain;
}

export const SwitchChain: React.FC<Props> = ({ connector, targetChain }) => {
  const { mutate: switchChain, isPending } = useMutation({
    mutationFn: async () =>
      await connector.switchChain?.({
        chainId: CHAIN_ID[targetChain],
      }),
  });

  return (
    <Button onClick={() => void switchChain()} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Switch Chain'}
    </Button>
  );
};
