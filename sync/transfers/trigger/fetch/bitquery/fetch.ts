import { logger } from '@trigger.dev/sdk/v3';
import {
  SyncConfig,
  Facilitator,
  TransferEventData,
  FacilitatorConfig,
} from '../../types';

export async function fetchWithOffsetPagination(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): Promise<TransferEventData[]> {
  const allTransfers = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    logger.log(`[${config.chain}] Fetching with offset: ${offset}`);

    const query = config.buildQuery(
      config,
      facilitatorConfig,
      since,
      now,
      offset
    );
    const transfers = await executeBitqueryRequest(
      config,
      facilitator,
      facilitatorConfig,
      query
    );

    allTransfers.push(...transfers);

    if (transfers.length < config.limit) {
      hasMore = false;
    } else {
      offset += config.limit;
    }
  }

  return allTransfers;
}

export async function fetchBitquery(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): Promise<TransferEventData[]> {
  logger.log(
    `[${config.chain}] Fetching Bitquery data from ${since.toISOString()} to ${now.toISOString()}`
  );

  const query = config.buildQuery(config, facilitatorConfig, since, now);
  return executeBitqueryRequest(config, facilitator, facilitatorConfig, query);
}

async function executeBitqueryRequest(
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig,
  query: string
): Promise<TransferEventData[]> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${process.env.BITQUERY_API_KEY!}`);

  const rawQuery = JSON.stringify({ query });

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: rawQuery,
  };

  const response = await fetch(config.apiUrl!, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[${config.chain}] Bitquery API error (${response.status}):`, {
      error: errorText,
    });
    throw new Error(`Bitquery API returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    logger.error(`[${config.chain}] Bitquery GraphQL errors:`, {
      errors: result.errors,
    });
    throw new Error(
      `Bitquery GraphQL errors: ${JSON.stringify(result.errors)}`
    );
  }

  return config.transformResponse(
    result.data,
    config,
    facilitator,
    facilitatorConfig
  );
}
