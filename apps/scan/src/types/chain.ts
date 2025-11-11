import { base, optimism, polygon } from 'wagmi/chains';
import type { Chain as ViemChain } from 'viem';

export enum Chain {
  BASE = 'base',
  SOLANA = 'solana',
  POLYGON = 'polygon',
  OPTIMISM = 'optimism',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA>;

export const SUPPORTED_CHAINS = [Chain.BASE, Chain.SOLANA] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type SupportedEVMChain = Exclude<SupportedChain, Chain.SOLANA>;

export const CHAIN_LABELS: Record<Chain, string> = {
  [Chain.BASE]: 'Base',
  [Chain.SOLANA]: 'Solana',
  [Chain.POLYGON]: 'Polygon',
  [Chain.OPTIMISM]: 'Optimism',
};

export const CHAIN_ICONS: Record<Chain, string> = {
  [Chain.BASE]: '/base.png',
  [Chain.SOLANA]: '/solana.png',
  [Chain.POLYGON]: '/polygon.png',
  [Chain.OPTIMISM]: '/optimism.png',
};

export const CHAIN_ID: Record<Chain, number> = {
  [Chain.BASE]: base.id,
  [Chain.POLYGON]: polygon.id,
  [Chain.OPTIMISM]: optimism.id,
  [Chain.SOLANA]: 0,
};

export const CHAIN_TO_VIEM_CHAIN = {
  [Chain.BASE]: base,
  [Chain.POLYGON]: polygon,
  [Chain.OPTIMISM]: optimism,
} as const satisfies Record<EvmChain, ViemChain>;
