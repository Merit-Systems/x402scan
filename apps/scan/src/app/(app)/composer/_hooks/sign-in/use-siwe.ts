"use client";

import { useMutation } from "@tanstack/react-query";

import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";

import { signInWithEthereum } from "@/auth/providers/siwe/sign-in";

interface Props {
  redirectParams?: Record<string, string>;
}

export const useSiwe = (props?: Props) => {
  const { address } = useAccount();

  const { signMessageAsync } = useSignMessage();

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: () => {
      if (!address) {
        throw new Error("No address found");
      }
      return signInWithEthereum({
        address: address,
        chainId: 8453,
        signMessage: (message) => signMessageAsync({ message }),
        redirectTo: props?.redirectParams
          ? `${window.location.href}?${new URLSearchParams(props.redirectParams).toString()}`
          : window.location.href,
      });
    },
    onSuccess: () => {
      toast.success("Signed in successfully");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to sign in");
    },
  });

  return {
    signIn,
    isPending,
  };
};
