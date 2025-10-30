import type { Address } from 'viem';

type EthereumAddress = Address;
export type SolanaAddress = string & { readonly __brand: unique symbol };
export type MixedAddress = EthereumAddress | SolanaAddress;
