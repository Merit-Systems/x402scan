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
        transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
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
      transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
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
      transaction_from: facilitatorId.toLowerCase(),
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
    ? { transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) } }
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

/**
 * Get overall statistics
 */
export interface GetOverallStatsInput {
  facilitatorIds?: string[];
  tokenAddresses?: string[];
  recipientAddresses?: string[];
  startDate?: Date;
  endDate?: Date;
}

export const getOverallStats = async (input: GetOverallStatsInput) => {
  const { facilitatorIds, tokenAddresses, recipientAddresses, startDate, endDate } = input;

  const where = {
    ...(facilitatorIds && facilitatorIds.length > 0 && {
      transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
    }),
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    ...(recipientAddresses && recipientAddresses.length > 0 && {
      recipient: { in: recipientAddresses.map(addr => addr.toLowerCase()) },
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

  const [count, aggregates, latestTransfer] = await Promise.all([
    transfersPrisma.transferEvent.count({ where }),
    transfersPrisma.transferEvent.aggregate({
      where,
      _sum: { amount: true },
    }),
    transfersPrisma.transferEvent.findFirst({
      where,
      orderBy: { block_timestamp: 'desc' },
      select: { block_timestamp: true },
    }),
  ]);

  // Get unique buyers and sellers
  const [uniqueBuyers, uniqueSellers] = await Promise.all([
    transfersPrisma.transferEvent.groupBy({
      by: ['sender'],
      where,
    }),
    transfersPrisma.transferEvent.groupBy({
      by: ['recipient'],
      where,
    }),
  ]);

  return {
    total_transactions: count,
    total_amount: aggregates._sum.amount ?? 0,
    unique_buyers: uniqueBuyers.length,
    unique_sellers: uniqueSellers.length,
    latest_block_timestamp: latestTransfer?.block_timestamp ?? new Date(),
  };
};

/**
 * Get first transfer timestamp
 */
export const getFirstTransferTimestamp = async (input: GetOverallStatsInput): Promise<Date | null> => {
  const { facilitatorIds, tokenAddresses, recipientAddresses, startDate, endDate } = input;

  const where = {
    ...(facilitatorIds && facilitatorIds.length > 0 && {
      transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
    }),
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    ...(recipientAddresses && recipientAddresses.length > 0 && {
      recipient: { in: recipientAddresses.map(addr => addr.toLowerCase()) },
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

  const firstTransfer = await transfersPrisma.transferEvent.findFirst({
    where,
    orderBy: { block_timestamp: 'asc' },
    select: { block_timestamp: true },
  });

  return firstTransfer?.block_timestamp ?? null;
};

/**
 * Get bucketed statistics
 */
export interface GetBucketedStatsInput extends GetOverallStatsInput {
  numBuckets: number;
}

export const getBucketedStats = async (input: GetBucketedStatsInput) => {
  const { facilitatorIds, tokenAddresses, recipientAddresses, startDate, endDate, numBuckets } = input;

  if (!startDate || !endDate) {
    return [];
  }

  const where = {
    ...(facilitatorIds && facilitatorIds.length > 0 && {
      transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
    }),
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    ...(recipientAddresses && recipientAddresses.length > 0 && {
      recipient: { in: recipientAddresses.map(addr => addr.toLowerCase()) },
    }),
    block_timestamp: { gte: startDate, lte: endDate },
  };

  // Get all transfers in the time range
  const transfers = await transfersPrisma.transferEvent.findMany({
    where,
    select: {
      block_timestamp: true,
      amount: true,
      sender: true,
      recipient: true,
    },
  });

  // Calculate bucket size
  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000));
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const firstBucketStartTimestamp = Math.floor(startTimestamp / bucketSizeSeconds) * bucketSizeSeconds;

  // Group transfers into buckets
  const bucketMap = new Map<number, {
    total_transactions: number;
    total_amount: number;
    buyers: Set<string>;
    sellers: Set<string>;
  }>();

  for (const transfer of transfers) {
    const timestamp = Math.floor(transfer.block_timestamp.getTime() / 1000);
    const bucketIndex = Math.floor((timestamp - firstBucketStartTimestamp) / bucketSizeSeconds);
    const bucketStartTimestamp = firstBucketStartTimestamp + bucketIndex * bucketSizeSeconds;

    if (!bucketMap.has(bucketStartTimestamp)) {
      bucketMap.set(bucketStartTimestamp, {
        total_transactions: 0,
        total_amount: 0,
        buyers: new Set(),
        sellers: new Set(),
      });
    }

    const bucket = bucketMap.get(bucketStartTimestamp)!;
    bucket.total_transactions++;
    bucket.total_amount += transfer.amount;
    bucket.buyers.add(transfer.sender);
    bucket.sellers.add(transfer.recipient);
  }

  // Generate complete time series
  const result = [];
  for (let i = 0; i < numBuckets; i++) {
    const bucketStartTimestamp = firstBucketStartTimestamp + i * bucketSizeSeconds;
    const bucketStart = new Date(bucketStartTimestamp * 1000);
    const bucket = bucketMap.get(bucketStartTimestamp);

    result.push({
      bucket_start: bucketStart,
      total_transactions: bucket?.total_transactions ?? 0,
      total_amount: bucket?.total_amount ?? 0,
      unique_buyers: bucket?.buyers.size ?? 0,
      unique_sellers: bucket?.sellers.size ?? 0,
    });
  }

  return result;
};

/**
 * List top facilitators
 */
export interface ListTopFacilitatorsInput {
  tokenAddresses?: string[];
  startDate?: Date;
  endDate?: Date;
  limit: number;
  sortBy: 'tx_count' | 'total_amount' | 'latest_block_timestamp' | 'unique_buyers' | 'unique_sellers';
  sortDesc: boolean;
}

export const listTopFacilitators = async (input: ListTopFacilitatorsInput) => {
  const { tokenAddresses, startDate, endDate } = input;

  const where = {
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

  // Group by transaction_from (facilitator address)
  const grouped = await transfersPrisma.transferEvent.groupBy({
    by: ['transaction_from'],
    where,
    _count: true,
    _sum: { amount: true },
    _max: { block_timestamp: true },
  });

  // For each facilitator, get unique buyers and sellers
  const results = await Promise.all(
    grouped.map(async (group) => {
      const facilitatorWhere = { ...where, transaction_from: group.transaction_from };
      
      const [uniqueBuyers, uniqueSellers] = await Promise.all([
        transfersPrisma.transferEvent.groupBy({
          by: ['sender'],
          where: facilitatorWhere,
        }),
        transfersPrisma.transferEvent.groupBy({
          by: ['recipient'],
          where: facilitatorWhere,
        }),
      ]);

      return {
        facilitator_id: group.transaction_from,
        tx_count: group._count,
        total_amount: group._sum.amount ?? 0,
        latest_block_timestamp: group._max.block_timestamp ?? new Date(),
        unique_buyers: uniqueBuyers.length,
        unique_sellers: uniqueSellers.length,
      };
    })
  );

  return results;
};

/**
 * List top sellers
 */
export interface ListTopSellersInput {
  facilitatorIds?: string[];
  tokenAddresses?: string[];
  recipientAddresses?: string[];
  startDate?: Date;
  endDate?: Date;
  limit: number;
  sortBy: 'tx_count' | 'total_amount' | 'latest_block_timestamp' | 'unique_buyers';
  sortDesc: boolean;
}

export const listTopSellers = async (input: ListTopSellersInput) => {
  const { facilitatorIds, tokenAddresses, recipientAddresses, startDate, endDate } = input;

  const where = {
    ...(facilitatorIds && facilitatorIds.length > 0 && {
      transaction_from: { in: facilitatorIds.map(id => id.toLowerCase()) },
    }),
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    ...(recipientAddresses && recipientAddresses.length > 0 && {
      recipient: { in: recipientAddresses.map(addr => addr.toLowerCase()) },
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

  // Group by recipient
  const grouped = await transfersPrisma.transferEvent.groupBy({
    by: ['recipient'],
    where,
    _count: true,
    _sum: { amount: true },
    _max: { block_timestamp: true },
  });

  // For each seller, get unique buyers and facilitators
  const results = await Promise.all(
    grouped.map(async (group) => {
      const sellerWhere = { ...where, recipient: group.recipient };
      
      const [uniqueBuyers, facilitators] = await Promise.all([
        transfersPrisma.transferEvent.groupBy({
          by: ['sender'],
          where: sellerWhere,
        }),
        transfersPrisma.transferEvent.groupBy({
          by: ['transaction_from'],
          where: sellerWhere,
        }),
      ]);

      return {
        recipient: group.recipient,
        tx_count: group._count,
        total_amount: group._sum.amount ?? 0,
        latest_block_timestamp: group._max.block_timestamp ?? new Date(),
        unique_buyers: uniqueBuyers.length,
        facilitators: facilitators.map(f => f.transaction_from),
      };
    })
  );

  return results;
};

/**
 * Get bucketed facilitators statistics
 */
export const getBucketedFacilitatorsStats = async (input: GetBucketedStatsInput) => {
  const { tokenAddresses, startDate, endDate, numBuckets } = input;

  if (!startDate || !endDate) {
    return [];
  }

  const where = {
    ...(tokenAddresses && tokenAddresses.length > 0 && {
      address: { in: tokenAddresses.map(addr => addr.toLowerCase()) },
    }),
    block_timestamp: { gte: startDate, lte: endDate },
  };

  // Get all transfers in the time range
  const transfers = await transfersPrisma.transferEvent.findMany({
    where,
    select: {
      block_timestamp: true,
      amount: true,
      sender: true,
      recipient: true,
      transaction_from: true,
    },
  });

  // Calculate bucket size
  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000));
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const firstBucketStartTimestamp = Math.floor(startTimestamp / bucketSizeSeconds) * bucketSizeSeconds;

  // Group transfers into buckets by facilitator
  type FacilitatorStats = {
    total_transactions: number;
    total_amount: number;
    buyers: Set<string>;
    sellers: Set<string>;
  };
  const bucketMap = new Map<number, Map<string, FacilitatorStats>>();

  for (const transfer of transfers) {
    const timestamp = Math.floor(transfer.block_timestamp.getTime() / 1000);
    const bucketIndex = Math.floor((timestamp - firstBucketStartTimestamp) / bucketSizeSeconds);
    const bucketStartTimestamp = firstBucketStartTimestamp + bucketIndex * bucketSizeSeconds;

    if (!bucketMap.has(bucketStartTimestamp)) {
      bucketMap.set(bucketStartTimestamp, new Map());
    }

    const facilitatorMap = bucketMap.get(bucketStartTimestamp)!;
    if (!facilitatorMap.has(transfer.transaction_from)) {
      facilitatorMap.set(transfer.transaction_from, {
        total_transactions: 0,
        total_amount: 0,
        buyers: new Set(),
        sellers: new Set(),
      });
    }

    const facilitatorStats = facilitatorMap.get(transfer.transaction_from)!;
    facilitatorStats.total_transactions++;
    facilitatorStats.total_amount += transfer.amount;
    facilitatorStats.buyers.add(transfer.sender);
    facilitatorStats.sellers.add(transfer.recipient);
  }

  // Generate complete time series
  const result = [];
  for (let i = 0; i < numBuckets; i++) {
    const bucketStartTimestamp = firstBucketStartTimestamp + i * bucketSizeSeconds;
    const bucketStart = new Date(bucketStartTimestamp * 1000);
    const facilitatorMap = bucketMap.get(bucketStartTimestamp) ?? new Map<string, FacilitatorStats>();

    const facilitators: Record<string, {
      total_transactions: number;
      total_amount: number;
      unique_buyers: number;
      unique_sellers: number;
    }> = {};

    for (const [facilitatorId, stats] of facilitatorMap.entries()) {
      facilitators[facilitatorId] = {
        total_transactions: stats.total_transactions,
        total_amount: stats.total_amount,
        unique_buyers: stats.buyers.size,
        unique_sellers: stats.sellers.size,
      };
    }

    result.push({
      bucket_start: bucketStart,
      facilitators,
    });
  }

  return result;
};

