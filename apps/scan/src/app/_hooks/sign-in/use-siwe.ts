'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { signInWithEthereum } from '@/auth/providers/siwe/sign-in';
import { toast } from 'sonner';

type Props = {
  redirectParams?: Record<string, string>;
};

export const useSiwe = (props?: Props) => {
  const { address } = useAccount();

  const { signMessageAsync } = useSignMessage();

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: () => {
      if (!address) {
        throw new Error('No address found');
      }
      return signInWithEthereum({
        address: address,
        chainId: 8453,
        signMessage: message => signMessageAsync({ message }),
        redirectTo: props?.redirectParams
          ? `${window.location.href}?${new URLSearchParams(props.redirectParams).toString()}`
          : window.location.href,
      });
    },
    onSuccess: () => {
      toast.success('Signed in successfully');
    },
    onError: error => {
      console.error(error);
      toast.error('Failed to sign in');
    },
  });

  return {
    signIn,
    isPending,
  };
};
