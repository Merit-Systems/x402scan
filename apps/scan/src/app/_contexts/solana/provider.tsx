"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCdpSolanaStandardWallet } from "@coinbase/cdp-solana-standard-wallet";
import { useWallets } from "@wallet-standard/react";

import { SolanaWalletContext } from "./context";
import { solanaWalletCookies } from "./cookies";

import type { ReactNode } from "react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import type { ConnectedSolanaWallet } from "./context";
import type { SolanaWalletCookie } from "./cookies";

interface Props {
  children: ReactNode;
}

export function getAutomaticConnection<
  TAccount extends { address: string },
  TWallet extends {
    name: string;
    accounts: readonly TAccount[];
    features: { includes: (feature: `${string}:${string}`) => boolean };
  },
>({
  wallets,
  savedWallet,
  cdpWalletAddress,
}: {
  wallets: readonly TWallet[];
  savedWallet: SolanaWalletCookie | null;
  cdpWalletAddress: string | undefined;
}) {
  if (savedWallet) {
    const matchingWallet = wallets.find(
      (wallet) => wallet.name === savedWallet.walletName
    );

    if (matchingWallet && matchingWallet.accounts.length > 0) {
      const matchingAccount = matchingWallet.accounts.find(
        (account) => account.address === savedWallet.address
      );

      if (matchingAccount) {
        return {
          wallet: { account: matchingAccount, wallet: matchingWallet },
          shouldPersist: false,
        };
      }

      if (matchingWallet.accounts.length === 1) {
        const [account] = matchingWallet.accounts;
        if (account) {
          return {
            wallet: { account, wallet: matchingWallet },
            shouldPersist: true,
          };
        }
      }
    }
  }

  if (cdpWalletAddress) {
    const matchingWallet = wallets.find(
      (wallet) =>
        wallet.features.includes("cdp:") &&
        wallet.accounts[0]?.address === cdpWalletAddress
    );
    const [account] = matchingWallet?.accounts ?? [];
    if (matchingWallet && account) {
      return {
        wallet: { account, wallet: matchingWallet },
        shouldPersist: false,
      };
    }
  }

  return null;
}

export function SolanaWalletProvider({ children }: Props) {
  const { ready, wallet: cdpWallet } = useCdpSolanaStandardWallet();

  const wallets = useWallets();

  const [selectedWallet, setSelectedWallet] = useState<
    ConnectedSolanaWallet | null | undefined
  >(undefined);

  const disconnect = useCallback(() => {
    setSelectedWallet(null);
    solanaWalletCookies.clear();
  }, []);

  const connectWallet = useCallback((wallet: ConnectedSolanaWallet | null) => {
    setSelectedWallet(wallet);
    if (wallet) {
      solanaWalletCookies.set({
        walletName: wallet.wallet.name,
        address: wallet.account.address,
      });
    } else {
      solanaWalletCookies.clear();
    }
  }, []);

  const automaticConnection = useMemo(() => {
    return getAutomaticConnection<UiWalletAccount, UiWallet>({
      wallets,
      savedWallet: solanaWalletCookies.get(),
      cdpWalletAddress: ready ? cdpWallet?.accounts[0]?.address : undefined,
    });
  }, [ready, cdpWallet, wallets]);

  useEffect(() => {
    if (selectedWallet !== undefined || !automaticConnection?.shouldPersist) {
      return;
    }
    solanaWalletCookies.set({
      walletName: automaticConnection.wallet.wallet.name,
      address: automaticConnection.wallet.account.address,
    });
  }, [automaticConnection, selectedWallet]);

  const connectedWallet =
    selectedWallet === undefined
      ? (automaticConnection?.wallet ?? null)
      : selectedWallet;
  const contextValue = useMemo(
    () => ({
      connectedWallet,
      setConnectedWallet: connectWallet,
      isConnected: Boolean(connectedWallet),
      disconnect,
    }),
    [connectedWallet, connectWallet, disconnect]
  );

  return (
    <SolanaWalletContext.Provider value={contextValue}>
      {children}
    </SolanaWalletContext.Provider>
  );
}
