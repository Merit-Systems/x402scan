import { logger } from '@trigger.dev/sdk/v3';
import { BigQuery } from '@google-cloud/bigquery';
import type {
  SyncConfig,
  Facilitator,
  TransferEventData,
  FacilitatorConfig,
} from '../../types';

export async function fetchBigQuery(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): Promise<TransferEventData[]> {
  const bq = new BigQuery({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS!),
  });

  logger.log(
    `[${config.chain}] Fetching BigQuery data from ${since.toISOString()} to ${now.toISOString()}`
  );

  const query = config.buildQuery(config, facilitatorConfig, since, now);
  logger.log(
    `[${config.chain}] BigQuery query for window: ${query.substring(0, 200)}...`
  );

  const [rows] = await bq.query({ query });

  logger.log(`[${config.chain}] BigQuery returned ${rows.length} rows`);

  return await config.transformResponse(
    rows,
    config,
    facilitator,
    facilitatorConfig
  );
}
