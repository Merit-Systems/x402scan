import { ONE_MINUTE_IN_SECONDS } from "@/trigger/lib/constants";
import type { SyncConfig } from "../../../types";
import { PaginationStrategy, QueryProvider, Network } from "../../../types";
import { FACILITATORS_BY_CHAIN } from "@/trigger/lib/facilitators";
import { buildQuery, transformResponse } from "./query";

// The payment-channels program was deployed to mainnet on 2026-06-24, so
// there are no channel payouts to index before that.
const CHANNELS_MAINNET_LAUNCH_AT = "2026-06-24T00:00:00.000Z";

// Indexes SVM `upto` and `batch-settlement` payouts: payment-channels
// `distribute` legs inside facilitator-signed USDC transactions. Rows are
// upserted so they win over the untagged rows the generic `bitquery` sync
// writes for the same transfers.
//
// Tracks its own sync-state cursor: most facilitators have no channel payouts
// yet, and without a cursor every run would re-scan their history from
// `syncStartDate` because there is no "most recent transfer" for this
// provider to resume from.
export const solanaChannelsChainConfig: SyncConfig = {
  cron: "*/30 * * * *",
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 30,
  chain: "solana",
  provider: QueryProvider.BITQUERY_CHANNELS,
  apiUrl: "https://graphql.bitquery.io",
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 10_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.SOLANA),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: "medium-1x",
  upsertOnConflict: true,
  useSyncState: true,
  syncStateCutoverAt: new Date(CHANNELS_MAINNET_LAUNCH_AT),
};
