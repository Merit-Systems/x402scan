import { USDC_MULTIPLIER } from '@/trigger/lib/constants';
import type {
  BitQueryTransferRow,
  Facilitator,
  FacilitatorConfig,
  SyncConfig,
  TransferEventData,
} from '@/trigger/types';

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date,
  offset?: number
): string {
  return `
    {
      solana(network: ${config.chain}) {
        sent: transfers(
          options: {desc: "block.height", limit: ${config.limit}, offset: ${offset}}
          time: {
            since: "${since.toISOString()}"
            till: "${now.toISOString()}"
          }
          amount: {gt: 0}
          signer: {
            is: ${JSON.stringify(facilitatorConfig.address)}
          }
          currency: {is: ${JSON.stringify(facilitatorConfig.token.address)}}
        ) {
          block {
            timestamp {
              time
            }
            height
          }
          sender {
            address
          }
          receiver {
            address
          }
          amount
          currency {
            name
            address
            symbol
          }
          transaction {
            feePayer
            signature
          }
        }
      }
    }
  `;
}

export function transformResponse(
  data: unknown,
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig
): TransferEventData[] {
  const transfers = (data as { solana: { sent: BitQueryTransferRow[] } }).solana
    .sent;

  return transfers.map(transfer => ({
    address: transfer.currency.address,
    transaction_from: facilitatorConfig.address,
    sender: transfer.sender.address,
    recipient: transfer.receiver.address,
    amount: Math.round(parseFloat(transfer.amount) * USDC_MULTIPLIER),
    block_timestamp: new Date(transfer.block.timestamp.time), // BitQuery returns ISO format with Z
    tx_hash: transfer.transaction.signature,
    chain: config.chain,
    provider: config.provider,
    decimals: facilitatorConfig.token.decimals,
    facilitator_id: facilitator.id,
    log_index: 0, // TODO(shafu): this breaks batching! we need better db constraints
  }));
}
