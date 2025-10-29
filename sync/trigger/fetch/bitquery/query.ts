import {
  DEFAULT_CONTRACT_ADDRESS,
  USDC_MULTIPLIER,
} from '@facilitators/constants';
import {
  SyncConfig,
  EvmChainConfig,
  Facilitator,
  PaginationStrategy,
  QueryProvider,
  TransferEventData,
  BitQueryTransferRowStream,
  FacilitatorConfig,
} from '@/trigger/types';

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): string {
  return `
    {
      EVM(network: ${config.chain}, dataset: combined) {
        Transfers(
          limit: {count: ${config.limit}}
          where: {
            Transaction: {
              From: {in: ${JSON.stringify(facilitatorConfig.address)}}
              Time: {
                since: "${since.toISOString()}"
                till: "${now.toISOString()}"
              }
            }
          }
          orderBy: {descending: Block_Number}
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
  return (data as BitQueryTransferRowStream[]).map(item => ({
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

export function createEvmChainConfig(params: EvmChainConfig): SyncConfig {
  return {
    ...params,
    apiUrl: 'https://streaming.bitquery.io/graphql',
    paginationStrategy: PaginationStrategy.TIME_WINDOW,
    provider: QueryProvider.BITQUERY,
    timeWindowInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    buildQuery,
    transformResponse,
    maxDurationInSeconds: 300,
    limit: 20_000,
    machine: 'medium-1x',
  };
}
