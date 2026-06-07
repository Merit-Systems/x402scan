import type {
  EvmBitQueryTransferRow,
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
  offset = 0
): string {
  return `
    {
      EVM(dataset: combined, network: base) {
        Transfers(
          limit: { count: ${config.limit}, offset: ${offset} }
          where: {
            Transfer: {
              Success: true
              Currency: {
                SmartContract: {
                  is: "${facilitatorConfig.token.address}"
                }
              }
            }
            Transaction: {
              From: {
                is: "${facilitatorConfig.address.toLowerCase()}"
              }
            }
            Block: {
              Time: {
                since: "${since.toISOString()}"
                till: "${now.toISOString()}"
              }
            }
          }
          orderBy: {
            ascending: [
              Block_Number,
              Transaction_Index,
              Call_Index,
              Log_Index,
              Transfer_Index,
              Transfer_Type
            ]
          }
        ) {
          Block {
            Time
            Number
          }
          Transaction {
            Hash
            From
            Index
          }
          Transfer {
            Amount
            Sender
            Receiver
            Index
            Type
            Success
            Currency {
              SmartContract
              Decimals
              Symbol
              Name
            }
          }
          Log {
            Index
          }
          Call {
            Index
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
  const transfers = (data as { EVM: { Transfers: EvmBitQueryTransferRow[] } })
    .EVM.Transfers;
  const multiplier = 10 ** facilitatorConfig.token.decimals;

  return transfers.map(transfer => {
    if (transfer.Log?.Index === undefined || transfer.Log.Index === null) {
      throw new Error(
        `Bitquery transfer is missing Log.Index for ${transfer.Transaction.Hash}`
      );
    }

    return {
      address: transfer.Transfer.Currency.SmartContract.toLowerCase(),
      transaction_from: transfer.Transaction.From.toLowerCase(),
      sender: transfer.Transfer.Sender.toLowerCase(),
      recipient: transfer.Transfer.Receiver.toLowerCase(),
      amount: Math.round(parseFloat(transfer.Transfer.Amount) * multiplier),
      block_timestamp: new Date(transfer.Block.Time),
      tx_hash: transfer.Transaction.Hash.toLowerCase(),
      log_index: transfer.Log.Index,
      chain: config.chain,
      provider: config.provider,
      decimals: facilitatorConfig.token.decimals,
      facilitator_id: facilitator.id,
    };
  });
}
