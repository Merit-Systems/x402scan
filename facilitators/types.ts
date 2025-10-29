export enum Chain {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}

export interface FacilitatorConfig {
  address: string;
  token: Token;
  syncStartDate: Date;
  enabled: boolean;
}

export interface Facilitator {
  id: string;
  name: string;
  image: string;
  link: string;
  color: string;
  addresses: Partial<Record<Chain, FacilitatorConfig[]>>;
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}
