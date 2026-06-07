import { createManyTransferEvents, getTransferEvents } from '@/db/services';
import { logger, schedules } from '@trigger.dev/sdk/v3';
import { Network } from './types';
import { fetchTransfers } from './fetch/fetch';

import type { Facilitator, SyncConfig } from './types';

type ResumeTransfer = Awaited<ReturnType<typeof getTransferEvents>>[number];

function normalizeTransactionFrom(chain: string, address: string): string {
  return chain === Network.SOLANA.toString() ? address : address.toLowerCase();
}

async function getMostRecentTransferForResume(
  syncConfig: SyncConfig,
  transactionFrom: string,
  resumeFromProviders: string[]
): Promise<ResumeTransfer | undefined> {
  const results = await Promise.all(
    resumeFromProviders.map(provider =>
      getTransferEvents({
        orderBy: { block_timestamp: 'desc' },
        take: 1,
        where: {
          chain: syncConfig.chain,
          transaction_from: transactionFrom,
          provider,
        },
      })
    )
  );

  return results
    .flat()
    .sort(
      (a, b) => b.block_timestamp.getTime() - a.block_timestamp.getTime()
    )[0];
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

    const resumeFromProviders = syncConfig.resumeFromProviders ?? [
      syncConfig.provider,
    ];
    const transactionFrom = normalizeTransactionFrom(
      syncConfig.chain,
      facilitatorConfig.address
    );

    const mostRecentTransfer = await getMostRecentTransferForResume(
      syncConfig,
      transactionFrom,
      resumeFromProviders
    );

    logger.log(
      `[${syncConfig.chain}] Most recent transfer from ${resumeFromProviders.join(',')}: ${mostRecentTransfer?.block_timestamp?.toISOString()}`
    );

    // Start from 1 second after the most recent transfer to avoid re-fetching it
    const since = mostRecentTransfer?.block_timestamp
      ? new Date(mostRecentTransfer.block_timestamp.getTime() + 1000)
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
