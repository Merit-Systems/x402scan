import type {
  SyncConfig,
  Facilitator,
  TransferEventData,
  FacilitatorConfig,
} from '@/trigger/types';
import { runCdpSqlQuery } from './helpers';
import { logger } from '@trigger.dev/sdk/v3';

export async function fetchCDP(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date,
  offset: number
): Promise<TransferEventData[]> {
  logger.log(
    `[${config.chain}] Fetching CDP data from ${since.toISOString()} to ${now.toISOString()}`
  );

  const query = config.buildQuery(
    config,
    facilitatorConfig,
    since,
    now,
    offset
  );
  const rows = await runCdpSqlQuery(query);

  return config.transformResponse(rows, config, facilitator, facilitatorConfig);
}
