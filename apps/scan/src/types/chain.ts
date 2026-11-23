import { base, optimism, polygon } from 'wagmi/chains';

export enum Chain {
  BASE = 'base',
  SOLANA = 'solana',
  POLYGON = 'polygon',
  OPTIMISM = 'optimism',
  ROBINHOOD = 'robinhood',
}

export const SUPPORTED_CHAINS = [Chain.BASE, Chain.SOLANA] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type SupportedEVMChain = Exclude<SupportedChain, Chain.SOLANA>;

// Chains whose resources can be registered and listed. Payment paths
// (wallets, onramp, composer) stay on SUPPORTED_CHAINS.
export const LISTED_CHAINS = [...SUPPORTED_CHAINS, Chain.ROBINHOOD] as const;

export type ListedChain = (typeof LISTED_CHAINS)[number];

export const CHAIN_LABELS = {
  [Chain.BASE]: 'Base',
  [Chain.SOLANA]: 'Solana',
  [Chain.POLYGON]: 'Polygon',
  [Chain.OPTIMISM]: 'Optimism',
  [Chain.ROBINHOOD]: 'Robinhood Chain',
} satisfies Record<Chain, string>;

export const CHAIN_ICONS = {
  [Chain.BASE]: '/base.png',
  [Chain.SOLANA]: '/solana.png',
  [Chain.POLYGON]: '/polygon.png',
  [Chain.OPTIMISM]: '/optimism.png',
  [Chain.ROBINHOOD]: '/robinhood.png',
} satisfies Record<Chain, string>;

export const CHAIN_ID = {
  [Chain.BASE]: base.id,
  [Chain.POLYGON]: polygon.id,
  [Chain.OPTIMISM]: optimism.id,
  [Chain.SOLANA]: 0,
  [Chain.ROBINHOOD]: 4663,
} satisfies Record<Chain, number>;
