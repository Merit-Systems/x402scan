import { prisma } from './client';
import { Prisma } from '@/generated/prisma';

/**
 * Create a new TransferEvent
 */
export async function createTransferEvent(
  data: Prisma.TransferEventCreateInput
) {
  return await prisma.transferEvent.create({
    data,
  });
}

/**
 * Create multiple TransferEvents in a single transaction
 */
export async function createManyTransferEvents(
  data: Prisma.TransferEventCreateManyInput[]
) {
  return await prisma.transferEvent.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * Update an existing TransferEvent by ID
 */
export async function updateTransferEvent(
  id: string,
  data: Prisma.TransferEventUpdateInput
) {
  return await prisma.transferEvent.update({
    where: { id },
    data,
  });
}

/**
 * Update many TransferEvents matching a condition
 */
export async function updateManyTransferEvents(
  where: Prisma.TransferEventWhereInput,
  data: Prisma.TransferEventUpdateManyMutationInput
) {
  return await prisma.transferEvent.updateMany({
    where,
    data,
  });
}

/**
 * Upsert a TransferEvent (update if exists, create if not)
 * Note: Since TransferEvent uses UUID, you'll need to provide a unique identifier
 */
export async function upsertTransferEvent(
  id: string,
  create: Prisma.TransferEventCreateInput,
  update: Prisma.TransferEventUpdateInput
) {
  return await prisma.transferEvent.upsert({
    where: { id },
    create,
    update,
  });
}

/**
 * Find a single TransferEvent by ID
 */
export async function getTransferEventById(id: string) {
  return await prisma.transferEvent.findUnique({
    where: { id },
  });
}

/**
 * Find a single TransferEvent by transaction hash
 */
export async function getTransferEventByTxHash(tx_hash: string) {
  return await prisma.transferEvent.findFirst({
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
  const { where, orderBy, skip, take } = params || {};

  return await prisma.transferEvent.findMany({
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
  return await prisma.transferEvent.findMany({
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
  return await prisma.transferEvent.findMany({
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
  return await prisma.transferEvent.findMany({
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
  return await prisma.transferEvent.findMany({
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
  return await prisma.transferEvent.count({ where });
}

/**
 * Delete a TransferEvent by ID
 */
export async function deleteTransferEvent(id: string) {
  return await prisma.transferEvent.delete({
    where: { id },
  });
}

/**
 * Delete multiple TransferEvents matching a condition
 */
export async function deleteManyTransferEvents(
  where: Prisma.TransferEventWhereInput
) {
  return await prisma.transferEvent.deleteMany({
    where,
  });
}
