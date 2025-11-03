import { createManyTransferEvents, getTransferEvents } from '@/db/services';
import { logger, schedules } from '@trigger.dev/sdk/v3';
import { Network, SyncConfig } from './types';
import { fetchTransfers } from './fetch/fetch';

export function createChainSyncTask(syncConfig: SyncConfig) {
  if (!syncConfig.enabled) {
    return;
  }

  return schedules.task({
    id: syncConfig.chain + '-sync-transfers-' + syncConfig.provider,
    cron: syncConfig.cron,
    maxDuration: syncConfig.maxDurationInSeconds,
    machine: syncConfig.machine,
    run: async () => {
      try {
        const now = new Date();

        for (const facilitator of syncConfig.facilitators) {
          for (const facilitatorConfig of facilitator.addresses[
            syncConfig.chain as Network
          ] ?? []) {
            if (!facilitatorConfig.enabled) {
              logger.log(
                `[${syncConfig.chain}] Sync is disabled for ${facilitator.id}`
              );
              continue;
            }

            const mostRecentTransfer = await getTransferEvents({
              orderBy: { block_timestamp: 'desc' },
              take: 1,
              where: {
                chain: syncConfig.chain,
                transaction_from:
                  syncConfig.chain === Network.SOLANA
                    ? facilitatorConfig.address
                    : facilitatorConfig.address.toLowerCase(),
                provider: syncConfig.provider,
              },
            });

            // Start from 1ms after the most recent transfer to avoid re-fetching it
            const since = mostRecentTransfer[0]?.block_timestamp
              ? new Date(mostRecentTransfer[0].block_timestamp.getTime() + 1)
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
      } catch (error) {
        logger.error(`[${syncConfig.chain}] Error syncing transfers:`, {
          error: String(error),
        });
        throw error;
      }
    },
  });
}
