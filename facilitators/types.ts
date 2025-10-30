export enum Chain {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}

export type EvmAddress = Lowercase<`0x${string}`>;
export type SolanaAddress = string;

export interface EvmFacilitatorConfig {
  address: EvmAddress;
  token: Token;
  syncStartDate: Date;
  enabled: boolean;
}

export interface SolanaFacilitatorConfig {
  address: SolanaAddress;
  token: Token;
  syncStartDate: Date;
  enabled: boolean;
}

export type FacilitatorConfig = EvmFacilitatorConfig | SolanaFacilitatorConfig;

type Url = `http://${string}` | `https://${string}`;
type ImagePath = `/${string}`;
type CssVariable = `var(--${string})`;

export interface Facilitator {
  id: string;
  name: string;
  image: ImagePath;
  link: Url;
  color: CssVariable;
  addresses: {
    [Chain.BASE]?: EvmFacilitatorConfig[];
    [Chain.POLYGON]?: EvmFacilitatorConfig[];
    [Chain.SOLANA]?: SolanaFacilitatorConfig[];
  };
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}
