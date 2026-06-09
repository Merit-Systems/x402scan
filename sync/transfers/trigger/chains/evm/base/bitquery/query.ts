import { TRANSFER_TOPIC } from '@/trigger/lib/constants';
import { logger } from '@trigger.dev/sdk/v3';
import type {
  EvmBitQueryEventRow,
  Facilitator,
  FacilitatorConfig,
  SyncConfig,
  TransferEventData,
} from '@/trigger/types';

const TRANSFER_TOPIC_WITHOUT_PREFIX = TRANSFER_TOPIC.replace(/^0x/, '');

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): string {
  // Bitquery treats both `since` and `till` as inclusive. The sync cursor is
  // the next window start, so subtract 1ms from the upper bound to make windows
  // behave like [since, now) and avoid refetching boundary events.
  const exclusiveTill = new Date(Math.max(since.getTime(), now.getTime() - 1));

  return `
    {
      EVM(dataset: combined, network: base) {
        Events(
          limit: { count: ${config.limit} }
          where: {
            LogHeader: {
              Address: {
                is: "${facilitatorConfig.token.address.toLowerCase()}"
              }
              Removed: false
            }
            Log: {
              Signature: {
                SignatureHash: {
                  is: "${TRANSFER_TOPIC_WITHOUT_PREFIX}"
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
                till: "${exclusiveTill.toISOString()}"
              }
            }
          }
          orderBy: {
            ascending: [
              Block_Number,
              Transaction_Index,
              Log_EnterIndex
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
          LogHeader {
            Address
            Index
            Removed
          }
          Log {
            EnterIndex
            Index
            LogAfterCallIndex
            SmartContract
          }
          Arguments {
            Name
            Value {
              ... on EVM_ABI_Address_Value_Arg {
                address
              }
              ... on EVM_ABI_BigInt_Value_Arg {
                bigInteger
              }
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
  const events = (data as { EVM: { Events: EvmBitQueryEventRow[] } }).EVM
    .Events;

  return events.flatMap(event => {
    const sender = getAddressArgument(event, 'from');
    const recipient = getAddressArgument(event, 'to');
    const amount = getBigIntArgument(event, 'value');

    if (!sender || !recipient || !amount) {
      logger.warn(
        `[${config.chain}] Skipping Bitquery event with missing args for ${event.Transaction.Hash}`
      );
      return [];
    }

    return {
      address: event.LogHeader.Address.toLowerCase(),
      transaction_from: event.Transaction.From.toLowerCase(),
      sender: sender.toLowerCase(),
      recipient: recipient.toLowerCase(),
      amount: Number(amount),
      block_timestamp: new Date(event.Block.Time),
      tx_hash: event.Transaction.Hash.toLowerCase(),
      log_index: event.Log.EnterIndex,
      chain: config.chain,
      provider: config.provider,
      decimals: facilitatorConfig.token.decimals,
      facilitator_id: facilitator.id,
    };
  });
}

function getAddressArgument(
  event: EvmBitQueryEventRow,
  name: string
): string | undefined {
  return event.Arguments.find(argument => argument.Name === name)?.Value
    .address;
}

function getBigIntArgument(
  event: EvmBitQueryEventRow,
  name: string
): string | undefined {
  return event.Arguments.find(argument => argument.Name === name)?.Value
    .bigInteger;
}
