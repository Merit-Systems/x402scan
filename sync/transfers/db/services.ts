import { transfersDb } from '@x402scan/transfers-db';

import type { Prisma } from '@x402scan/transfers-db';

/**
 * Create a new TransferEvent
 */
export async function createTransferEvent(
  data: Prisma.TransferEventCreateInput
) {
  return await transfersDb.transferEvent.create({
    data,
  });
}

/**
 * Create multiple TransferEvents in a single transaction
 */
export async function createManyTransferEvents(
  data: Prisma.TransferEventCreateManyInput[]
) {
  return await transfersDb.transferEvent.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * Update many TransferEvents matching a condition
 */
export async function updateManyTransferEvents(
  where: Prisma.TransferEventWhereInput,
  data: Prisma.TransferEventUpdateManyMutationInput
) {
  return await transfersDb.transferEvent.updateMany({
    where,
    data,
  });
}

/**
 * Find a single TransferEvent by transaction hash
 */
export async function getTransferEventByTxHash(tx_hash: string) {
  return await transfersDb.transferEvent.findFirst({
    where: { tx_hash },
  });
}

/**
 * Find multiple TransferEvents with optional filtering, sorting, and pagination
 */
export async function getTransferEvents(params?: {
  where?: Prisma.TransferEventWhereInput;
  orderBy?: Prisma.TransferEventOrderByWithRelationInput;
  skip?: number;
  take?: number;
}) {
  const { where, orderBy, skip, take } = params ?? {};

  return await transfersDb.transferEvent.findMany({
    where,
    orderBy,
    skip,
    take,
  });
}

/**
 * Get TransferEvents by chain
 */
export async function getTransferEventsByChain(
  chain: string,
  params?: {
    orderBy?: Prisma.TransferEventOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }
) {
  return await transfersDb.transferEvent.findMany({
    where: { chain },
    orderBy: params?.orderBy,
    skip: params?.skip,
    take: params?.take,
  });
}

/**
 * Get TransferEvents by address (contract address)
 */
export async function getTransferEventsByAddress(
  address: string,
  params?: {
    orderBy?: Prisma.TransferEventOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }
) {
  return await transfersDb.transferEvent.findMany({
    where: { address },
    orderBy: params?.orderBy,
    skip: params?.skip,
    take: params?.take,
  });
}

/**
 * Get TransferEvents by sender address
 */
export async function getTransferEventsBySender(
  sender: string,
  params?: {
    orderBy?: Prisma.TransferEventOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }
) {
  return await transfersDb.transferEvent.findMany({
    where: { sender },
    orderBy: params?.orderBy,
    skip: params?.skip,
    take: params?.take,
  });
}

/**
 * Get TransferEvents by recipient address
 */
export async function getTransferEventsByRecipient(
  recipient: string,
  params?: {
    orderBy?: Prisma.TransferEventOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }
) {
  return await transfersDb.transferEvent.findMany({
    where: { recipient },
    orderBy: params?.orderBy,
    skip: params?.skip,
    take: params?.take,
  });
}

/**
 * Count TransferEvents matching a condition
 */
export async function countTransferEvents(
  where?: Prisma.TransferEventWhereInput
) {
  return await transfersDb.transferEvent.count({ where });
}

/**
 * Delete multiple TransferEvents matching a condition
 */
export async function deleteManyTransferEvents(
  where: Prisma.TransferEventWhereInput
) {
  return await transfersDb.transferEvent.deleteMany({
    where,
  });
}

export interface TransferSyncStateKey {
  chain: string;
  provider: string;
  facilitator_id: string;
  transaction_from: string;
  token_address: string;
}

function syncStateWhere(key: TransferSyncStateKey) {
  return {
    chain_provider_facilitator_id_transaction_from_token_address: key,
  };
}

export async function getTransferSyncState(key: TransferSyncStateKey) {
  return await transfersDb.transferSyncState.findUnique({
    where: syncStateWhere(key),
  });
}

export async function createTransferSyncState(
  key: TransferSyncStateKey,
  cursorTimestamp: Date
) {
  return await transfersDb.transferSyncState.upsert({
    where: syncStateWhere(key),
    create: {
      ...key,
      cursor_timestamp: cursorTimestamp,
    },
    update: {},
  });
}

export async function markTransferSyncStateStarted(
  key: TransferSyncStateKey,
  startedAt: Date
) {
  return await transfersDb.transferSyncState.update({
    where: syncStateWhere(key),
    data: {
      last_started_at: startedAt,
      last_error: null,
    },
  });
}

export async function advanceTransferSyncState(
  key: TransferSyncStateKey,
  cursorTimestamp: Date,
  completedAt: Date
) {
  return await transfersDb.transferSyncState.update({
    where: syncStateWhere(key),
    data: {
      cursor_timestamp: cursorTimestamp,
      last_completed_at: completedAt,
      last_error: null,
    },
  });
}

export async function recordTransferSyncStateError(
  key: TransferSyncStateKey,
  error: string
) {
  return await transfersDb.transferSyncState.update({
    where: syncStateWhere(key),
    data: {
      last_error: error,
    },
  });
}
