import { base, optimism, polygon } from 'wagmi/chains';

export enum Chain {
  BASE = 'base',
  SOLANA = 'solana',
  POLYGON = 'polygon',
  OPTIMISM = 'optimism',
  ALGORAND = 'algorand',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA | Chain.ALGORAND>;

export const SUPPORTED_CHAINS = [Chain.BASE, Chain.SOLANA] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type SupportedEVMChain = Exclude<SupportedChain, Chain.SOLANA>;

export const CHAIN_LABELS: Record<Chain, string> = {
  [Chain.BASE]: 'Base',
  [Chain.SOLANA]: 'Solana',
  [Chain.POLYGON]: 'Polygon',
  [Chain.OPTIMISM]: 'Optimism',
  [Chain.ALGORAND]: 'Algorand',
};

export const CHAIN_ICONS: Record<Chain, string> = {
  [Chain.BASE]: '/base.png',
  [Chain.SOLANA]: '/solana.png',
  [Chain.POLYGON]: '/polygon.png',
  [Chain.OPTIMISM]: '/optimism.png',
  [Chain.ALGORAND]: '/algorand.png',
};

export const CHAIN_ID: Record<Chain, number> = {
  [Chain.BASE]: base.id,
  [Chain.POLYGON]: polygon.id,
  [Chain.OPTIMISM]: optimism.id,
  [Chain.SOLANA]: 0,
  [Chain.ALGORAND]: 416001,
};
