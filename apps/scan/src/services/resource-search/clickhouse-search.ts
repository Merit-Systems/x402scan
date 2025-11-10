import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import type {
  SearchResult,
  ResourceAnalytics,
  EnrichedSearchResult,
} from './types';

/**
 * Enriches search results with ClickHouse analytics data
 */
export async function enrichSearchResults(
  results: SearchResult[]
): Promise<EnrichedSearchResult[]> {
  if (results.length === 0) {
    return [];
  }

  const urls = results.map(r => r.resource);
  const analyticsMap = await fetchAnalyticsForUrls(urls);

  return results.map(result => ({
    ...result,
    analytics: analyticsMap.get(result.resource) ?? null,
  }));
}

/**
 * Fetches aggregated analytics data from ClickHouse for multiple URLs in a single query
 */
async function fetchAnalyticsForUrls(
  urls: string[]
): Promise<Map<string, ResourceAnalytics>> {
  if (urls.length === 0) {
    return new Map();
  }

  const query = `
    SELECT
      url,
      count() as total_calls,
      avg(duration) as avg_duration,
      countIf(status_code >= 200 AND status_code < 300) / count() as success_rate,
      argMaxIf(response_body, created_at, status_code = 200) as sample_response_body
    FROM resource_invocations
    WHERE url IN {urls:Array(String)}
    GROUP BY url
  `;

  const resultSet = await clickhouse.query({
    query,
    format: 'JSONEachRow',
    query_params: { urls },
  });

  const rows = await resultSet.json<{
    url: string;
    total_calls: number;
    avg_duration: number;
    success_rate: number;
    sample_response_body: string | null;
  }>();

  const analyticsMap = new Map<string, ResourceAnalytics>();

  for (const row of rows) {
    analyticsMap.set(row.url, {
      totalCalls: row.total_calls,
      avgDuration: row.avg_duration,
      successRate: row.success_rate,
      sampleResponseBody: row.sample_response_body,
    });
  }

  return analyticsMap;
}
