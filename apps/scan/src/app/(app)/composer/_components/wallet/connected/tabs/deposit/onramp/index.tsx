"use client";

import Image from "next/image";

import { useSession } from "next-auth/react";

import { OnrampContent } from "./content";
import { UnauthedOnramp } from "./unauthed";

import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";

import { chainToAuthProviderId } from "@/auth/providers/wallet-map";

export const Onramp = () => {
  const { chain } = useWalletChain();

  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  const providerId = chainToAuthProviderId[chain];
  const hasConnectedWallet = session?.user.accounts.some(
    (account) => account.provider === providerId
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Image
          src="/coinbase.png"
          alt="Base"
          height={16}
          width={16}
          className="mr-1 inline-block size-4 rounded-full"
        />
        <span className="text-sm font-bold">Onramp</span>
      </div>
      {hasConnectedWallet ? <OnrampContent /> : <UnauthedOnramp />}
    </div>
  );
};
