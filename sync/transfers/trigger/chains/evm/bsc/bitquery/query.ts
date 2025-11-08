import {
  DEFAULT_CONTRACT_ADDRESS,
  USDC_MULTIPLIER,
} from '@/trigger/lib/constants';
import {
  SyncConfig,
  Facilitator,
  TransferEventData,
  BitQueryTransferRowStream,
  FacilitatorConfig,
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
      EVM(dataset: realtime, network: bsc) {
        Transfers(
          limit: {count: ${config.limit}, offset: ${offset || 0}}
          where: {
            Transaction: {
              From: {in: ${JSON.stringify(facilitatorConfig.address)}}
            }
            Transfer: {
              Currency: {
                SmartContract: {is: ${JSON.stringify(facilitatorConfig.token.address)}}
              }
            }
          }
        ) {
          Transfer {
            Amount
            Sender
            Receiver
            Currency {
              Name
              SmartContract
              Symbol
            }
          }
          Block {
            Time
            Number
          }
          Transaction {
            Hash
            From
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
  const transfers =
    (data as { EVM?: { Transfers?: BitQueryTransferRowStream[] } })?.EVM
      ?.Transfers || [];

  return (transfers as BitQueryTransferRowStream[]).map(item => ({
    address: item.Transfer.Currency?.SmartContract || DEFAULT_CONTRACT_ADDRESS,
    transaction_from: item.Transaction.From,
    sender: item.Transfer.Sender,
    recipient: item.Transfer.Receiver,
    amount: Math.round(parseFloat(item.Transfer.Amount) * USDC_MULTIPLIER),
    block_timestamp: new Date(item.Block.Time),
    tx_hash: item.Transaction.Hash,
    chain: config.chain,
    provider: config.provider,
    decimals: facilitatorConfig.token.decimals,
    facilitator_id: facilitator.id,
  }));
}
