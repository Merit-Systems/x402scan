import {
  USDC_DECIMALS,
  USDC_MULTIPLIER,
  USDC_POLYGON,
  TRANSFER_TOPIC,
} from '@/trigger/lib/constants';
import {
  SyncConfig,
  TransferEventData,
  BigQueryTransferRow,
  FacilitatorConfig,
} from '@/trigger/types';

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): string {
  return `
    DECLARE facilitator_addresses ARRAY<STRING> DEFAULT [
    "${facilitatorConfig.address}"
    ];
    DECLARE usdc_address STRING DEFAULT '${USDC_POLYGON.toLowerCase()}';
    DECLARE transfer_topic STRING DEFAULT '${TRANSFER_TOPIC}';
    DECLARE start_ts TIMESTAMP DEFAULT TIMESTAMP('${since.toISOString()}');
    DECLARE end_ts TIMESTAMP DEFAULT TIMESTAMP('${now.toISOString()}');

    SELECT
    l.address,
    t.from_address AS transaction_from,
    CONCAT('0x', SUBSTRING(l.topics[SAFE_OFFSET(1)], 27)) AS sender,
    CONCAT('0x', SUBSTRING(l.topics[SAFE_OFFSET(2)], 27)) AS recipient,
    SAFE_DIVIDE(CAST(CONCAT('0x', l.data) AS NUMERIC), POW(10, 6)) AS amount,
    l.block_timestamp,
    l.transaction_hash AS tx_hash,
    '${config.chain}' AS chain
    FROM \`bigquery-public-data.crypto_polygon.logs\` l
    JOIN \`bigquery-public-data.crypto_polygon.transactions\` t
    ON l.transaction_hash = t.hash
    AND l.block_timestamp = t.block_timestamp
    WHERE l.block_timestamp >= start_ts
    AND l.block_timestamp < end_ts
    AND l.address = usdc_address
    AND l.topics[SAFE_OFFSET(0)] = transfer_topic
    AND LOWER(t.from_address) IN UNNEST(facilitator_addresses)
    ORDER BY l.block_timestamp DESC
    LIMIT ${config.limit}`;
}

export function transformResponse(
  data: unknown,
  config: SyncConfig
): TransferEventData[] {
  return (data as BigQueryTransferRow[]).map(row => ({
    address: row.address,
    transaction_from: row.transaction_from,
    sender: row.sender,
    recipient: row.recipient,
    amount: Math.round(parseFloat(row.amount) * USDC_MULTIPLIER),
    block_timestamp: new Date(row.block_timestamp.value),
    tx_hash: row.tx_hash,
    chain: row.chain,
    provider: config.provider,
    decimals: USDC_DECIMALS,
    facilitator_id: row.facilitator_id,
  }));
}
