export interface TransferEventData {
  address: string;
  transaction_from: string;
  sender: string;
  recipient: string;
  amount: number;
  block_timestamp: Date;
  tx_hash: string;
  chain: string;
  provider: string;
  decimals: number;
  facilitator_id: string;

  log_index?: number;
}

export enum PaginationStrategy {
  TIME_WINDOW = 'time-window',
  OFFSET = 'offset',
}

export enum QueryProvider {
  BITQUERY = 'bitquery',
  BIGQUERY = 'bigquery',
  CDP = 'cdp',
}

interface BaseQueryConfig {
  chain: string;
  provider: QueryProvider;
  apiUrl?: string;
  buildQuery: (
    config: SyncConfig,
    facilitatorConfig: FacilitatorConfig,
    since: Date,
    now: Date,
    offset?: number
  ) => string;
  transformResponse: (
    data: unknown,
    config: SyncConfig,
    facilitator: Facilitator,
    facilitatorConfig: FacilitatorConfig
  ) => TransferEventData[] | Promise<TransferEventData[]>;
}

interface TimeWindowQueryConfig extends BaseQueryConfig {
  paginationStrategy: PaginationStrategy.TIME_WINDOW;
  timeWindowInMs: number;
}

interface OffsetQueryConfig extends BaseQueryConfig {
  paginationStrategy: PaginationStrategy.OFFSET;
  timeWindowInMs?: never;
}

export type QueryConfig = TimeWindowQueryConfig | OffsetQueryConfig;

export type SyncConfig = QueryConfig & {
  cron: string;
  maxDurationInSeconds: number;
  facilitators: Facilitator[];
  limit: number;
};

export interface EvmChainConfig {
  cron: string;
  maxDuration: number;
  network: string;
  chain: string;
  facilitators: Facilitator[];
}

export enum Chain {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}

export type EvmAddress = Lowercase<`0x${string}`>;
export type SolanaAddress = string; // Solana addresses are base58, validated at runtime

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

export interface CdpTransferRow {
  contract_address: string;
  sender: string;
  transaction_from: string;
  to_address: string;
  transaction_hash: string;
  block_timestamp: string;
  amount: string;
  log_index: number;
}

export interface BigQueryTransferRow {
  address: string;
  transaction_from: string;
  sender: string;
  recipient: string;
  amount: string;
  block_timestamp: { value: string };
  tx_hash: string;
  chain: string;
  facilitator_id: string;
  transfer_index?: number;
}

export interface BitQueryTransferRow {
  block: {
    timestamp: { time: string };
    height: number;
  };
  sender: { address: string };
  receiver: { address: string };
  amount: string;
  currency: { address: string };
  transaction: { feePayer: string; signature: string };
}

export interface BitQueryTransferRowStream {
  Transfer: {
    Amount: string;
    Sender: string;
    Receiver: string;
    Currency: {
      Name: string;
      SmartContract: string;
      Symbol: string;
    };
  };
  Block: {
    Time: string;
    Number: number;
  };
  Transaction: {
    Hash: string;
    From: string;
  };
}
