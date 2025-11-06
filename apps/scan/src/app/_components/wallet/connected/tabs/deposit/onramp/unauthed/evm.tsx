import { useSiwe } from '@/app/_hooks/sign-in/use-siwe';
import { NoSessionContent } from './component';
import { Chain } from '@/types/chain';

interface Props {
  chain: Chain;
}

export const NoEVMSessionContent: React.FC<Props> = ({ chain }) => {
  const { signIn, isPending } = useSiwe({
    redirectParams: {
      onramp: 'true',
      chain: chain,
    },
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
