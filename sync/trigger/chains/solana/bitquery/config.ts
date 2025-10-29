import { USDC_MULTIPLIER } from '@facilitators/constants';
import {
  SyncConfig,
  Facilitator,
  PaginationStrategy,
  QueryProvider,
  TransferEventData,
  Chain,
  BitQueryTransferRow,
  FacilitatorConfig,
} from '../../../types';
import { FACILITATORS_BY_CHAIN } from '@facilitators/config';

function buildQuery(
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
            in: ${JSON.stringify(facilitatorConfig.address)}
          }
          currency: {is: ${JSON.stringify(facilitatorConfig.token.address)}}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
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

function transformResponse(
  data: unknown,
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig
): TransferEventData[] {
  const transfers = (data as { solana: { sent: BitQueryTransferRow[] } }).solana
    .sent;

  return transfers.map(transfer => ({
    address: transfer.currency.address,
    transaction_from: transfer.transaction.feePayer,
    sender: transfer.sender.address,
    recipient: transfer.receiver.address,
    amount: Math.round(parseFloat(transfer.amount) * USDC_MULTIPLIER),
    block_timestamp: new Date(transfer.block.timestamp.time),
    tx_hash: transfer.transaction.signature,
    chain: config.chain,
    provider: config.provider,
    decimals: facilitatorConfig.token.decimals,
    facilitator_id: facilitator.id,
  }));
}

export const solanaChainConfig: SyncConfig = {
  cron: '0 * * * *',
  maxDurationInSeconds: 300,
  chain: 'solana',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://graphql.bitquery.io',
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 10_000, // NOTE(shafu): more than that and bitquery 503
  facilitators: FACILITATORS_BY_CHAIN(Chain.SOLANA),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
};
