export const AGENTS_SORT_IDS = [
  "score",
  "message_count",
  "tool_call_count",
  "user_count",
  "chat_count",
  "createdAt",
] as const;
export type AgentSortId = (typeof AGENTS_SORT_IDS)[number];
export const DEFAULT_AGENTS_SORTING = {
  id: "score",
  desc: true,
} satisfies { id: AgentSortId; desc: boolean };

export const FACILITATORS_SORT_IDS = [
  "tx_count",
  "total_amount",
  "latest_block_timestamp",
  "unique_buyers",
  "unique_sellers",
] as const;
export type FacilitatorsSortId = (typeof FACILITATORS_SORT_IDS)[number];
export const DEFAULT_FACILITATORS_SORTING = {
  id: "tx_count",
  desc: true,
} satisfies { id: FacilitatorsSortId; desc: boolean };

export const NETWORKS_SORT_IDS = [
  "tx_count",
  "total_amount",
  "latest_block_timestamp",
  "unique_buyers",
  "unique_sellers",
  "unique_facilitators",
] as const;
export type NetworksSortId = (typeof NETWORKS_SORT_IDS)[number];
export const DEFAULT_NETWORKS_SORTING = {
  id: "tx_count",
  desc: true,
} satisfies { id: NetworksSortId; desc: boolean };

export const SELLERS_SORT_IDS = [
  "tx_count",
  "total_amount",
  "latest_block_timestamp",
  "unique_buyers",
  "editorial",
] as const;
export type SellerSortId = (typeof SELLERS_SORT_IDS)[number];
export const DEFAULT_SELLERS_SORTING = {
  id: "tx_count",
  desc: true,
} satisfies { id: SellerSortId; desc: boolean };

export const TOOL_SORT_IDS = [
  "toolCalls",
  "agentConfigurations",
  "uniqueUsers",
  "latestCallTime",
] as const;
export type ToolSortId = (typeof TOOL_SORT_IDS)[number];
export const DEFAULT_TOOLS_SORTING = {
  id: "toolCalls",
  desc: true,
} satisfies { id: ToolSortId; desc: boolean };

export const TRANSFERS_SORT_IDS = ["block_timestamp", "amount"] as const;
type TransfersSortId = (typeof TRANSFERS_SORT_IDS)[number];
export const DEFAULT_TRANSFERS_SORTING = {
  id: "block_timestamp",
  desc: true,
} satisfies { id: TransfersSortId; desc: boolean };
