import {
  SyncConfig,
  Facilitator,
  TransferEventData,
  CdpTransferRow,
  FacilitatorConfig,
} from '@/trigger/types';
import { TRANSFER_EVENT_SIG } from '@facilitators/constants';

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): string {
  return `
    SELECT
      address AS contract_address,
      parameters['from']::String AS sender,
      transaction_from,
      parameters['to']::String AS to_address,
      transaction_hash,
      block_timestamp,
      parameters['value']::UInt256 AS amount,
      log_index
    FROM base.events
    WHERE event_signature = '${TRANSFER_EVENT_SIG}'
      AND address = '${facilitatorConfig.token.address.toLowerCase()}'
      AND transaction_from = '${facilitatorConfig.address.toLowerCase()}'
      AND block_timestamp >= '${formatDateForSql(since)}'
      AND block_timestamp < '${formatDateForSql(now)}'
    ORDER BY block_timestamp DESC
    LIMIT ${config.limit};
  `;
}

export function transformResponse(
  data: unknown,
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig
): TransferEventData[] {
  return (data as CdpTransferRow[]).map(row => ({
    address: row.contract_address,
    transaction_from: row.transaction_from,
    sender: row.sender,
    recipient: row.to_address,
    amount: parseFloat(row.amount),
    block_timestamp: new Date(row.block_timestamp),
    tx_hash: row.transaction_hash,
    log_index: row.log_index,
    chain: config.chain,
    provider: config.provider,
    decimals: facilitatorConfig.token.decimals,
    facilitator_id: facilitator.id,
  }));
}

function formatDateForSql(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
