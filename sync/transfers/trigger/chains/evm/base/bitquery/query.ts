import { TRANSFER_TOPIC } from '@/trigger/lib/constants';
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
  now: Date,
  offset = 0
): string {
  return `
    {
      EVM(dataset: combined, network: base) {
        Events(
          limit: { count: ${config.limit}, offset: ${offset} }
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
                till: "${now.toISOString()}"
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

  return events.map(event => {
    const sender = getAddressArgument(event, 'from');
    const recipient = getAddressArgument(event, 'to');
    const amount = getBigIntArgument(event, 'value');

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

function getAddressArgument(event: EvmBitQueryEventRow, name: string): string {
  const value = event.Arguments.find(argument => argument.Name === name)?.Value
    .address;

  if (!value) {
    throw new Error(
      `Bitquery event is missing ${name} address for ${event.Transaction.Hash}`
    );
  }

  return value;
}

function getBigIntArgument(event: EvmBitQueryEventRow, name: string): string {
  const value = event.Arguments.find(argument => argument.Name === name)?.Value
    .bigInteger;

  if (!value) {
    throw new Error(
      `Bitquery event is missing ${name} amount for ${event.Transaction.Hash}`
    );
  }

  return value;
}
