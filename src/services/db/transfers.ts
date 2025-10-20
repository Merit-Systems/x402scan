import 'server-only';
import { transfersPrisma } from './transfers-client';
import { toPaginatedResponse } from '@/lib/pagination';

/**
 * Get single transfer by transaction hash
 */
export const getTransferByTxHash = async (
  txHash: string, 
  facilitatorIds?: string[]
) => {
  return await transfersPrisma.transferEvent.findFirst({
    where: {
      tx_hash: txHash.toLowerCase(),
      ...(facilitatorIds && facilitatorIds.length > 0 && {
        facilitator_id: { in: facilitatorIds.map(id => id.toLowerCase()) },
      }),
    },
    orderBy: {
      block_timestamp: 'desc',
    },
  });
};

/**
 * List transfers with filtering and pagination
 */
export interface ListTransfersInput {
  recipient?: string;
  sender?: string;
  facilitatorIds?: string[];
  tokenAddresses?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  sortBy?: 'block_timestamp' | 'amount';
  sortDesc?: boolean;
}

export const listTransfers = async (input: ListTransfersInput) => {
  const {
    recipient,
    sender,
    facilitatorIds,
    tokenAddresses,
    startDate,
    endDate,
    limit = 100,
    sortBy = 'block_timestamp',
    sortDesc = true,
  } = input;

  const where = {
    ...(recipient && { recipient: recipient.toLowerCase() }),
    ...(sender && { sender: sender.toLowerCase() }),
    ...(facilitatorIds && facilitatorIds.length > 0 && {
      facilitator_id: { in: facilitatorIds.map(id => id.toLowerCase()) },
    }),
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    ...(startDate && endDate && {
      block_timestamp: { gte: startDate, lte: endDate },
    }),
    ...(startDate && !endDate && {
      block_timestamp: { gte: startDate },
    }),
    ...(!startDate && endDate && {
      block_timestamp: { lte: endDate },
    }),
  };

  const transfers = await transfersPrisma.transferEvent.findMany({
    where,
    orderBy: {
      [sortBy]: sortDesc ? 'desc' : 'asc',
    },
    take: limit + 1,
  });

  return toPaginatedResponse({
    items: transfers,
    limit,
  });
};

/**
 * Get transfers by facilitator
 */
export const getTransfersByFacilitator = async (
  facilitatorId: string,
  limit = 100
) => {
  return await transfersPrisma.transferEvent.findMany({
    where: {
      facilitator_id: facilitatorId.toLowerCase(),
    },
    orderBy: {
      block_timestamp: 'desc',
    },
    take: limit,
  });
};

/**
 * Get transfers by recipient (seller)
 */
export const getTransfersByRecipient = async (
  recipient: string,
  limit = 100
) => {
  return await transfersPrisma.transferEvent.findMany({
    where: {
      recipient: recipient.toLowerCase(),
    },
    orderBy: {
      block_timestamp: 'desc',
    },
    take: limit,
  });
};

/**
 * Get transfer statistics
 */
export const getTransferStats = async (facilitatorIds?: string[]) => {
  const where = facilitatorIds && facilitatorIds.length > 0
    ? { facilitator_id: { in: facilitatorIds.map(id => id.toLowerCase()) } }
    : {};

  const [totalTransfers, totalVolume, firstTransfer] = await Promise.all([
    transfersPrisma.transferEvent.count({ where }),
    transfersPrisma.transferEvent.aggregate({
      where,
      _sum: { amount: true },
    }),
    transfersPrisma.transferEvent.findFirst({
      where,
      orderBy: { block_timestamp: 'asc' },
    }),
  ]);

  return {
    totalTransfers,
    totalVolume: totalVolume._sum.amount ?? 0,
    firstTransferDate: firstTransfer?.block_timestamp ?? null,
  };
};

