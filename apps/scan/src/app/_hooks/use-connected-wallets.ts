import { useAccount } from 'wagmi';
import { useSolanaWallet } from '../_contexts/solana/hook';
import { EthereumAddress, SolanaAddress } from '@/types/address';

export type NotConnectedWallets = {
  isConnected: false;
  evmAddress: undefined;
  solanaAddress: undefined;
};

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

  if (address && connectedWallet?.account?.address) {
    return {
      isConnected: true,
      evmAddress: address as EthereumAddress,
      solanaAddress: connectedWallet.account.address as SolanaAddress,
    };
  }
  if (connectedWallet?.account?.address && !address) {
    return {
      isConnected: true,
      evmAddress: undefined,
      solanaAddress: connectedWallet.account.address as SolanaAddress,
    };
  }
  if (address && !connectedWallet?.account?.address) {
    return {
      isConnected: true,
      evmAddress: address as EthereumAddress,
      solanaAddress: undefined,
    };
  }
  return {
    isConnected: false,
    evmAddress: undefined,
    solanaAddress: undefined,
  };
};
