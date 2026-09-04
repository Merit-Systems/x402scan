import { describe, expect, it } from "vitest";

import { getAutomaticConnection } from "./provider";

function createWallet({
  name,
  address,
  features = [],
}: {
  name: string;
  address: string;
  features?: string[];
}) {
  const account = { address };
  const wallet = {
    name,
    accounts: [account],
    features,
  };

  return { account, wallet };
}

describe("getAutomaticConnection", () => {
  it("prefers the persisted wallet when a CDP wallet is also available", () => {
    const persisted = createWallet({
      name: "Persisted wallet",
      address: "persisted-address",
    });
    const cdp = createWallet({
      name: "CDP Solana Wallet",
      address: "cdp-address",
      features: ["cdp:"],
    });

    const connection = getAutomaticConnection({
      wallets: [cdp.wallet, persisted.wallet],
      savedWallet: {
        walletName: persisted.wallet.name,
        address: persisted.account.address,
      },
      cdpWalletAddress: cdp.account.address,
    });

    expect(connection?.wallet).toEqual(persisted);
    expect(connection?.shouldPersist).toBe(false);
  });
});
