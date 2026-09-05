import { useAccount } from "wagmi";
import { useSolanaWallet } from "@/app/_contexts/solana/hook";
import { solanaAddressSchema } from "@/lib/schemas";
import type { EthereumAddress, SolanaAddress } from "@/types/address";

interface NotConnectedWallets {
  isConnected: false;
  evmAddress: undefined;
  solanaAddress: undefined;
}

export type ConnectedWallets = {
  isConnected: true;
} & (
  | {
      evmAddress: EthereumAddress;
      solanaAddress: SolanaAddress;
    }
  | {
      evmAddress: undefined;
      solanaAddress: SolanaAddress;
    }
  | {
      evmAddress: EthereumAddress;
      solanaAddress: undefined;
    }
);

type UseConnectedWalletsReturnType = ConnectedWallets | NotConnectedWallets;

export const useConnectedWallets = (): UseConnectedWalletsReturnType => {
  const { address } = useAccount();

  const { connectedWallet } = useSolanaWallet();
  const solanaAddressResult = solanaAddressSchema.safeParse(
    connectedWallet?.account.address
  );
  const solanaAddress = solanaAddressResult.success
    ? solanaAddressResult.data
    : undefined;

  if (address && solanaAddress) {
    return {
      isConnected: true,
      evmAddress: address,
      solanaAddress,
    };
  }
  if (solanaAddress && !address) {
    return {
      isConnected: true,
      evmAddress: undefined,
      solanaAddress,
    };
  }
  if (address && !solanaAddress) {
    return {
      isConnected: true,
      evmAddress: address,
      solanaAddress: undefined,
    };
  }
  return {
    isConnected: false,
    evmAddress: undefined,
    solanaAddress: undefined,
  };
};
