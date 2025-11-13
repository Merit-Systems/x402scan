import { analyticsDb } from '@x402scan/analytics-db';
import { NextResponse } from 'next/server';

interface LatencyRequest {
  originUrl: string;
  resourceUrl?: string;
  startDate: string;
  endDate: string;
  bucketMinutes: number;
}

interface LatencyResponse {
  ts: string;
  p50: number;
  p90: number;
  p99: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<LatencyResponse[]>> {
  try {
    const { originUrl, resourceUrl, startDate, endDate, bucketMinutes } =
      (await request.json()) as LatencyRequest;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Use exact match if resourceUrl is provided, otherwise use LIKE pattern
    const urlCondition = resourceUrl
      ? 'url = {url: String}'
      : 'url LIKE {urlPattern: String}';

    const query = `
      WITH
        toDateTime({end: String}) AS t_end,
        toDateTime({start: String}) AS t_start,
        toIntervalMinute({bucketMinutes: UInt32}) AS bucket

      SELECT
        toStartOfInterval(created_at, bucket) AS ts,
        quantile(0.5)(duration) AS p50,
        quantile(0.9)(duration) AS p90,
        quantile(0.99)(duration) AS p99
      FROM resource_invocations
      WHERE created_at >= t_start
        AND created_at <= t_end
        AND ${urlCondition}
      GROUP BY ts
      ORDER BY ts
    `;

    const resultSet = await analyticsDb.query({
      query,
      format: 'JSONEachRow',
      query_params: {
        start: start.toISOString().replace('T', ' ').split('.')[0],
        end: end.toISOString().replace('T', ' ').split('.')[0],
        bucketMinutes,
        url: resourceUrl ?? '',
        urlPattern: `%${originUrl}%`,
      },
    });

    const data = await resultSet.json();

    return NextResponse.json(data as LatencyResponse[]);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json<LatencyResponse[]>([], { status: 500 });
  }
}
