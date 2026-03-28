import { base } from 'wagmi/chains';

export enum Chain {
  BASE = 'base',
  SOLANA = 'solana',
}

export type EvmChain = Exclude<Chain, Chain.SOLANA>;

export const SUPPORTED_CHAINS = [Chain.BASE, Chain.SOLANA] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export type SupportedEVMChain = Exclude<SupportedChain, Chain.SOLANA>;

export const CHAIN_LABELS: Record<Chain, string> = {
  [Chain.BASE]: 'Base',
  [Chain.SOLANA]: 'Solana',
};

export const CHAIN_ICONS: Record<Chain, string> = {
  [Chain.BASE]: '/base.png',
  [Chain.SOLANA]: '/solana.png',
};

export const CHAIN_ID: Record<Chain, number> = {
  [Chain.BASE]: base.id,
  [Chain.SOLANA]: 0,
};
