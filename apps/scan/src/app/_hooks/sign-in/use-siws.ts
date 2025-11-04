'use client';

import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';

import { useSignMessage } from '@solana/react';
import { UiWalletAccount } from '@wallet-standard/react';
import { signInWithSolana } from '@/auth/providers/siws/sign-in';

interface Props {
  account: UiWalletAccount;
  isOnramp?: boolean;
}

export const useSiws = (props: Props) => {
  const { account, isOnramp } = props;

  const signMessage = useSignMessage(account);

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: () => {
      if (!account.address) {
        throw new Error('No address found');
      }
      return signInWithSolana({
        address: account.address,
        signMessage,
        redirectTo: isOnramp
          ? `${window.location.href}?onramp=true`
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
