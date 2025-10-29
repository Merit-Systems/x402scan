import type { FacilitatorConfig } from 'x402/types';

type FacilitatorConfigProp<Props = void> =
  | FacilitatorConfig
  | ((requirements: Props) => FacilitatorConfig);

export interface Facilitator<Props = void> {
  id: string;
  metadata: FacilitatorMetadata;
  config: FacilitatorConfigProp<Props>;
  addresses: Partial<Record<Chain, FacilitatorAddress[]>>;
  discoveryConfig?: FacilitatorConfig;
}

export interface FacilitatorMetadata {
  name: string;
  image: string;
  docsUrl: string;
  color: string;
}

export interface FacilitatorAddress {
  address: string;
  tokens: Token[];
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}

export enum Chain {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}
