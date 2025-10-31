import { logger } from '@trigger.dev/sdk/v3';
import { FacilitatorConfig, SyncConfig, TransferEventData } from '../types';

export async function fetchWithTimeWindowing(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date,
  executeQuery: (query: string) => Promise<TransferEventData[]>
): Promise<TransferEventData[]> {
  const allTransfers = [];
  let currentStart = new Date(since);
  const timeWindowMs = config.timeWindowInMs!;

  while (currentStart < now) {
    const currentEnd = new Date(
      Math.min(currentStart.getTime() + timeWindowMs, now.getTime())
    );

    logger.log(
      `[${config.chain}] Fetching window: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`
    );

    const query = config.buildQuery(
      config,
      facilitatorConfig,
      currentStart,
      currentEnd
    );
    const results = await executeQuery(query);

    allTransfers.push(...results);
    logger.log(
      `[${config.chain}] Fetched ${results.length} results in this time window`
    );

    if (results.length >= config.limit) {
      logger.warn(
        `[${config.chain}] Window returned ${results.length} results (at or above limit of ${config.limit}). Some data might be missing. Consider reducing TIME_WINDOW_DAYS or increasing the limit.`
      );
    }

    currentStart = currentEnd;
  }

  return allTransfers;
}
