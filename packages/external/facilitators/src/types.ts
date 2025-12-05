import type { FacilitatorConfig } from 'x402/types';

export type { FacilitatorConfig } from 'x402/types';
export type FacilitatorConfigConstructor<Props = void> = (
  requirements: Props
) => FacilitatorConfig;

type FacilitatorConfigProp<Props = void> =
  | FacilitatorConfig
  | FacilitatorConfigConstructor<Props>;

export interface Facilitator<Props = void> {
  id: string;
  metadata: FacilitatorMetadata;
  config: FacilitatorConfigProp<Props>;
  addresses: Partial<Record<Network, FacilitatorAddress[]>>;
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
  dateOfFirstTransaction: Date;
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}

export enum Network {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  BINANCE = 'binance',
}
