import { USDC_MULTIPLIER } from '@/trigger/lib/constants';
import {
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
        ethereum(network: ${config.chain}) {
            transfers(
            currency: {is: "${facilitatorConfig.token.address}"}
            options: {limit: ${config.limit}, offset: ${offset || 0}}
            date: {since: "${since.toISOString()}", till: "${now.toISOString()}"}
            txFrom: {is: "${facilitatorConfig.address}"}
            ) {
            sender {
                address
            }
            receiver {
                address
            }
            currency {
                name
                symbol
                address
            }
            amount
            block {
                timestamp {
                    time
                }
                height
            }
            transaction {
                hash
                txFrom {
                    address
                }
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
  const response = data as { ethereum: { transfers: any[] } };

  return response.ethereum.transfers.map((transfer: any) => ({
    address: transfer.currency?.address,
    transaction_from:
      transfer.transaction?.txFrom?.address || transfer.sender.address,
    sender: transfer.sender.address,
    recipient: transfer.receiver.address,
    amount: Math.round(parseFloat(transfer.amount) * USDC_MULTIPLIER),
    block_timestamp: new Date(transfer.block.timestamp.time),
    tx_hash: transfer.transaction.hash,
    chain: config.chain,
    provider: config.provider,
    decimals: facilitatorConfig.token.decimals,
    facilitator_id: facilitator.id,
  }));
}
