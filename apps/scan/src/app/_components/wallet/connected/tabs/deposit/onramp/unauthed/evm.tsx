import { useSiwe } from '@/app/_hooks/sign-in/use-siwe';
import { NoSessionContent } from './component';

export const NoEVMSessionContent = () => {
  const { signIn, isPending } = useSiwe({
    isOnramp: true,
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
