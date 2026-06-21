import {
  advanceTransferSyncState,
  createManyTransferEvents,
  createTransferSyncState,
  getTransferEvents,
  getTransferSyncState,
  markTransferSyncStateStarted,
  recordTransferSyncStateError,
  type TransferSyncStateKey,
} from '@/db/services';
import { logger, schedules } from '@trigger.dev/sdk/v3';
import { Network, QueryProvider } from './types';
import { fetchTransfers } from './fetch/fetch';

import type { Facilitator, FacilitatorConfig, SyncConfig } from './types';

function normalizeAddress(chain: string, address: string): string {
  return chain === Network.SOLANA.toString() ? address : address.toLowerCase();
}

function getSyncStateKey(
  syncConfig: SyncConfig,
  facilitator: Facilitator,
  transactionFrom: string,
  tokenAddress: string
): TransferSyncStateKey {
  return {
    chain: syncConfig.chain,
    provider: syncConfig.provider,
    facilitator_id: facilitator.id,
    transaction_from: transactionFrom,
    token_address: normalizeAddress(syncConfig.chain, tokenAddress),
  };
}

async function getBootstrapCursor(
  syncConfig: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  transactionFrom: string
) {
  const mostRecentCdpTransfer = await getTransferEvents({
    orderBy: { block_timestamp: 'desc' },
    take: 1,
    where: {
      address: normalizeAddress(
        syncConfig.chain,
        facilitatorConfig.token.address
      ),
      chain: syncConfig.chain,
      transaction_from: transactionFrom,
      provider: QueryProvider.CDP,
    },
  });

  const cutoverAt =
    typeof syncConfig.syncStateCutoverAt === 'function'
      ? syncConfig.syncStateCutoverAt()
      : syncConfig.syncStateCutoverAt;

  const candidates = [
    facilitatorConfig.syncStartDate,
    cutoverAt,
    mostRecentCdpTransfer[0]?.block_timestamp
      ? new Date(mostRecentCdpTransfer[0].block_timestamp.getTime() + 1000)
      : undefined,
  ].filter((date): date is Date => date !== undefined);

  return new Date(Math.max(...candidates.map(date => date.getTime())));
}

async function getOrCreateTransferSyncState(
  syncConfig: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  transactionFrom: string
) {
  const key = getSyncStateKey(
    syncConfig,
    facilitator,
    transactionFrom,
    facilitatorConfig.token.address
  );
  const existing = await getTransferSyncState(key);

  if (existing) {
    return { key, state: existing };
  }

  const cursorTimestamp = await getBootstrapCursor(
    syncConfig,
    facilitatorConfig,
    transactionFrom
  );

  logger.log(
    `[${syncConfig.chain}] Bootstrapping sync state for ${facilitator.id}:${facilitatorConfig.address} at ${cursorTimestamp.toISOString()}`
  );

  const state = await createTransferSyncState(key, cursorTimestamp);

  return { key, state };
}

async function syncFacilitator(
  syncConfig: SyncConfig,
  facilitator: Facilitator,
  now: Date
) {
  for (const facilitatorConfig of facilitator.addresses[
    syncConfig.chain as Network
  ] ?? []) {
    if (!facilitatorConfig.enabled) {
      logger.log(
        `[${syncConfig.chain}] Sync is disabled for ${facilitator.id}`
      );
      continue;
    }

    logger.log(
      `[${syncConfig.chain}] Getting most recent transfer for ${facilitator.id}:${facilitatorConfig.address}`
    );

    const transactionFrom = normalizeAddress(
      syncConfig.chain,
      facilitatorConfig.address
    );

    if (syncConfig.useSyncState) {
      const { key, state } = await getOrCreateTransferSyncState(
        syncConfig,
        facilitator,
        facilitatorConfig,
        transactionFrom
      );
      const since = state.cursor_timestamp;

      logger.log(
        `[${syncConfig.chain}] Syncing ${facilitator.id}:${facilitatorConfig.address} from sync state ${since.toISOString()} to ${now.toISOString()}`
      );

      await markTransferSyncStateStarted(key, now);

      if (since >= now) {
        logger.log(
          `[${syncConfig.chain}] Sync state is current for ${facilitator.id}:${facilitatorConfig.address}`
        );
        await advanceTransferSyncState(key, since, new Date());
        continue;
      }

      let totalSaved = 0;

      try {
        const { totalFetched } = await fetchTransfers(
          syncConfig,
          facilitator,
          facilitatorConfig,
          since,
          now,
          async batch => {
            const syncResult = await createManyTransferEvents(batch);
            totalSaved += syncResult.count;
            logger.log(
              `[${syncConfig.chain}] Saved ${syncResult.count} transfers (${batch.length} fetched, ${batch.length - syncResult.count} duplicates)`
            );
          },
          async (_windowStart, windowEnd, resultCount) => {
            await advanceTransferSyncState(key, windowEnd, new Date());
            logger.log(
              `[${syncConfig.chain}] Advanced sync state to ${windowEnd.toISOString()} after ${resultCount} fetched transfers`
            );
          }
        );

        logger.log(
          `[${syncConfig.chain}] Completed ${facilitator.id}: ${totalFetched} fetched, ${totalSaved} saved`
        );
      } catch (error) {
        await recordTransferSyncStateError(key, String(error));
        throw error;
      }

      continue;
    }

    const mostRecentTransfer = await getTransferEvents({
      orderBy: { block_timestamp: 'desc' },
      take: 1,
      where: {
        chain: syncConfig.chain,
        transaction_from: transactionFrom,
        provider: syncConfig.provider,
      },
    });

    logger.log(
      `[${syncConfig.chain}] Most recent transfer: ${mostRecentTransfer[0]?.block_timestamp?.toISOString()}`
    );

    // Start from 1 second after the most recent transfer to avoid re-fetching it
    const since = mostRecentTransfer[0]?.block_timestamp
      ? new Date(mostRecentTransfer[0].block_timestamp.getTime() + 1000)
      : facilitatorConfig.syncStartDate;

    logger.log(
      `[${syncConfig.chain}] Syncing ${facilitator.id}:${facilitatorConfig.address} from ${since.toISOString()} to ${now.toISOString()}`
    );

    let totalSaved = 0;

    const { totalFetched } = await fetchTransfers(
      syncConfig,
      facilitator,
      facilitatorConfig,
      since,
      now,
      async batch => {
        const syncResult = await createManyTransferEvents(batch);
        totalSaved += syncResult.count;
        logger.log(
          `[${syncConfig.chain}] Saved ${syncResult.count} transfers (${batch.length} fetched, ${batch.length - syncResult.count} duplicates)`
        );
      }
    );

    logger.log(
      `[${syncConfig.chain}] Completed ${facilitator.id}: ${totalFetched} fetched, ${totalSaved} saved`
    );
  }
}

function createSingleSyncTask(syncConfig: SyncConfig) {
  return schedules.task({
    id: syncConfig.chain + '-' + syncConfig.provider,
    cron: syncConfig.cron,
    maxDuration: syncConfig.maxDurationInSeconds,
    machine: syncConfig.machine,
    run: async () => {
      try {
        const now = new Date();

        for (const facilitator of syncConfig.facilitators) {
          await syncFacilitator(syncConfig, facilitator, now);
        }
      } catch (error) {
        logger.error(`[${syncConfig.chain}] Error syncing transfers:`, {
          error: String(error),
        });
        throw error;
      }
    },
  });
}

function createSplitSyncTasks(syncConfig: SyncConfig) {
  return syncConfig.facilitators.map(facilitator => {
    return schedules.task({
      id: `${syncConfig.chain}-${syncConfig.provider}-${facilitator.id}`,
      cron: syncConfig.cron,
      maxDuration: syncConfig.maxDurationInSeconds,
      machine: syncConfig.machine,
      run: async () => {
        try {
          const now = new Date();
          await syncFacilitator(syncConfig, facilitator, now);
        } catch (error) {
          logger.error(
            `[${syncConfig.chain}] Error syncing transfers for ${facilitator.id}:`,
            {
              error: String(error),
            }
          );
          throw error;
        }
      },
    });
  });
}

export function createChainSyncTask(syncConfig: SyncConfig) {
  if (!syncConfig.enabled) {
    return;
  }

  if (syncConfig.splitSyncByFacilitator) {
    return createSplitSyncTasks(syncConfig);
  }

  return createSingleSyncTask(syncConfig);
}
