import { Network, type Token } from "facilitators";

export { Network, type Token };

export interface FacilitatorConfig {
  address: string;
  token: Token;
  syncStartDate: Date;
  enabled: boolean;
}

export interface Facilitator {
  id: string;
  addresses: Partial<Record<Network, FacilitatorConfig[]>>;
}

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
  scheme?: string;
}

export enum PaginationStrategy {
  TIME_WINDOW = "time-window",
  OFFSET = "offset",
}

export enum QueryProvider {
  BITQUERY = "bitquery",
  BITQUERY_CHANNELS = "bitquery-channels",
  BIGQUERY = "bigquery",
  CDP = "cdp",
}

/**
 * Raw provider payloads handed to `transformResponse`. Each query module
 * declares which member it consumes; the fetch layer passes the provider's
 * response through unchanged.
 */
export type RawTransferQueryResponse =
  | BigQueryTransferRow[]
  | CdpTransferRow[]
  | BitQueryTransferRowStream[]
  | EvmBitqueryEventsResponse
  | SolanaBitquerySentResponse;

export interface EvmBitqueryEventsResponse {
  EVM: { Events: EvmBitQueryEventRow[] };
}

export interface SolanaBitquerySentResponse {
  solana: { sent: BitQueryTransferRow[] };
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
  // Method syntax (bivariant parameters) so each query module can declare the
  // specific RawTransferQueryResponse member its paired buildQuery produces.
  transformResponse(
    data: RawTransferQueryResponse,
    config: SyncConfig,
    facilitator: Facilitator,
    facilitatorConfig: FacilitatorConfig
  ): TransferEventData[] | Promise<TransferEventData[]>;
}

type TimeWindowQueryConfig = BaseQueryConfig & {
  paginationStrategy: PaginationStrategy.TIME_WINDOW;
  timeWindowInMs: number;
};

type OffsetQueryConfig = BaseQueryConfig & {
  paginationStrategy: PaginationStrategy.OFFSET;
  timeWindowInMs?: never;
};

export type QueryConfig = TimeWindowQueryConfig | OffsetQueryConfig;

export type SyncConfig = QueryConfig & {
  cron: string;
  maxDurationInSeconds: number;
  facilitators: Facilitator[];
  limit: number;
  enabled: boolean;
  machine: "small-1x" | "medium-1x" | "large-2x";
  splitSyncByFacilitator?: boolean;
  useSyncState?: boolean;
  syncStateCutoverAt?: Date;
  // Upsert rows on the (tx_hash, log_index, chain, block_timestamp) key
  // instead of createMany+skipDuplicates, so this sync's rows win over rows
  // another provider already wrote for the same transfer.
  upsertOnConflict?: boolean;
};

export interface EvmChainConfig {
  cron: string;
  maxDuration: number;
  network: string;
  chain: string;
  facilitators: Facilitator[];
  enabled: boolean;
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

export interface EvmBitQueryEventRow {
  Block: {
    Time: string;
    Number: number;
  };
  Transaction: {
    Hash: string;
    From: string;
    Index: number;
  };
  LogHeader: {
    Address: string;
    Index: number | null;
    Removed: boolean;
  };
  Log: {
    EnterIndex: number;
    Index: number | null;
    LogAfterCallIndex: number | null;
    SmartContract: string;
  };
  Arguments: {
    Name: string;
    Value: {
      address?: string;
      bigInteger?: string;
    };
  }[];
}
