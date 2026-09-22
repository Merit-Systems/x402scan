import { base, optimism, polygon } from 'wagmi/chains';

export enum Chain {
  BASE = 'base',
  SOLANA = 'solana',
  POLYGON = 'polygon',
  OPTIMISM = 'optimism',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA>;

/**
 * Chains registration/indexing accepts, in addition to the ones backed by a
 * server wallet (`Wallets`/`EvmWallets` in services/cdp/server-wallet/wallets).
 * Kept separate on purpose: a chain with no wallet-backed signing on this stack
 * can still publish compliant x402 v2 challenges that this app discovers,
 * indexes and probes read-only. Chains that DO have a signing path are listed
 * twice (here and in the wallet map) — see PR #1013.
 */
export const SUPPORTED_CHAINS = [
  Chain.BASE,
  Chain.SOLANA,
  Chain.POLYGON,
] as const;

/**
 * Chains this app can sign/broadcast on. Must stay a subset of
 * SUPPORTED_CHAINS; it keys the CDP server-wallet map.
 */
export const WALLET_CHAINS = [Chain.BASE, Chain.SOLANA] as const;

export type WalletChain = (typeof WALLET_CHAINS)[number];

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type SupportedEVMChain = Exclude<SupportedChain, Chain.SOLANA>;

export const CHAIN_LABELS = {
  [Chain.BASE]: 'Base',
  [Chain.SOLANA]: 'Solana',
  [Chain.POLYGON]: 'Polygon',
  [Chain.OPTIMISM]: 'Optimism',
} satisfies Record<Chain, string>;

export const CHAIN_ICONS = {
  [Chain.BASE]: '/base.png',
  [Chain.SOLANA]: '/solana.png',
  [Chain.POLYGON]: '/polygon.png',
  [Chain.OPTIMISM]: '/optimism.png',
} satisfies Record<Chain, string>;

export const CHAIN_ID = {
  [Chain.BASE]: base.id,
  [Chain.POLYGON]: polygon.id,
  [Chain.OPTIMISM]: optimism.id,
  [Chain.SOLANA]: 0,
} satisfies Record<Chain, number>;
