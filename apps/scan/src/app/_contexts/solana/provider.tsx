"use client";

import { useEffect, useState, useCallback } from "react";

import { useCdpSolanaStandardWallet } from "@coinbase/cdp-solana-standard-wallet";
import { useWallets } from "@wallet-standard/react";

import { SolanaWalletContext } from "./context";
import { solanaWalletCookies } from "./cookies";

import type { ReactNode } from "react";
import type { ConnectedSolanaWallet } from "./context";

interface Props {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: Props) {
  const { ready, wallet: cdpWallet } = useCdpSolanaStandardWallet();

  const wallets = useWallets();

  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedSolanaWallet | null>(null);

  const disconnect = useCallback(() => {
    setConnectedWallet(null);
    solanaWalletCookies.clear();
  }, []);

  const connectWallet = useCallback((wallet: ConnectedSolanaWallet | null) => {
    setConnectedWallet(wallet);
    if (wallet) {
      solanaWalletCookies.set({
        walletName: wallet.wallet.name,
        address: wallet.account.address,
      });
    } else {
      solanaWalletCookies.clear();
    }
  }, []);

  useEffect(() => {
    if (ready && cdpWallet) {
      const matchingWallet = wallets.find(
        (candidateWallet) =>
          candidateWallet.features.includes("cdp:") &&
          candidateWallet.accounts[0]?.address ===
            cdpWallet.accounts[0]?.address
      );
      const [account] = matchingWallet?.accounts ?? [];
      if (matchingWallet && account) {
        setConnectedWallet({
          account,
          wallet: matchingWallet,
        });
      }
    }
  }, [ready, cdpWallet, wallets]);

  useEffect(() => {
    if (connectedWallet) return;

    const savedWallet = solanaWalletCookies.get();
    if (!savedWallet) {
      return;
    }

    // Try to find and reconnect to the saved wallet
    const matchingWallet = wallets.find(
      (w) => w.name === savedWallet.walletName
    );

    if (matchingWallet && matchingWallet.accounts.length > 0) {
      // Check if wallet has matching account (some wallets auto-populate accounts)
      const matchingAccount = matchingWallet.accounts.find(
        (acc) => acc.address === savedWallet.address
      );

      if (matchingAccount) {
        setConnectedWallet({
          account: matchingAccount,
          wallet: matchingWallet,
        });
      } else if (matchingWallet.accounts.length === 1) {
        const [account] = matchingWallet.accounts;
        if (!account) return;
        // If there's only one account and it doesn't match, update the cookie with new address
        setConnectedWallet({
          account,
          wallet: matchingWallet,
        });
        solanaWalletCookies.set({
          walletName: matchingWallet.name,
          address: account.address,
        });
      }
    }
  }, [wallets, connectedWallet]);

  return (
    <SolanaWalletContext.Provider
      value={{
        connectedWallet,
        setConnectedWallet: connectWallet,
        isConnected: !!connectedWallet,
        disconnect,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
}
