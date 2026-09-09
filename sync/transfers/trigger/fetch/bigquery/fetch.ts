import { logger } from "@trigger.dev/sdk/v3";
import { BigQuery } from "@google-cloud/bigquery";
import { JWT } from "google-auth-library";
import { z } from "zod";
import type {
  SyncConfig,
  Facilitator,
  TransferEventData,
  FacilitatorConfig,
} from "../../types";

const serviceAccountCredentialsSchema = z.object({
  client_email: z.string().min(1),
  private_key: z.string().min(1),
  private_key_id: z.string().optional(),
  project_id: z.string().min(1),
});

const getServiceAccountCredentials = () =>
  serviceAccountCredentialsSchema.parse(
    JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS!)
  );

export async function fetchBigQuery(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): Promise<TransferEventData[]> {
  const credentials = getServiceAccountCredentials();
  const authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    keyId: credentials.private_key_id,
    scopes: ["https://www.googleapis.com/auth/bigquery"],
  });
  const bq = new BigQuery({
    authClient,
    projectId: credentials.project_id,
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

  return config.transformResponse(rows, config, facilitator, facilitatorConfig);
}
