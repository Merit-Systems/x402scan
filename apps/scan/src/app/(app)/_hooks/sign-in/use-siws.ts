'use client';

import { useMutation } from '@tanstack/react-query';

import { useSignMessage } from '@solana/react';

import { toast } from 'sonner';

import { signInWithSolana } from '@/auth/providers/siws/sign-in';

import type { UiWalletAccount } from '@wallet-standard/react';

interface Props {
  account: UiWalletAccount;
  redirectParams?: Record<string, string>;
}

export const useSiws = (props: Props) => {
  const { account, redirectParams } = props;

  const signMessage = useSignMessage(account);

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: () => {
      if (!account.address) {
        throw new Error('No address found');
      }
      return signInWithSolana({
        address: account.address,
        signMessage: signMessage,
        redirectTo: redirectParams
          ? `${window.location.href}?${new URLSearchParams(redirectParams).toString()}`
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
