import { analyticsDb } from '@x402scan/analytics-db';
import { NextResponse } from 'next/server';

interface ErrorRateRequest {
  originUrl: string;
  resourceUrl?: string;
  startDate: string;
  endDate: string;
  bucketMinutes: number;
}

interface ErrorRateResponse {
  ts: string;
  total_requests: number;
  error_requests: number;
  error_rate: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<ErrorRateResponse[]>> {
  try {
    const { originUrl, resourceUrl, startDate, endDate, bucketMinutes } =
      (await request.json()) as ErrorRateRequest;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // NOTE(shafu): use exact match if resourceUrl is provided, otherwise use LIKE pattern
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
        count() AS total_requests,
        countIf(status_code >= 500) AS error_requests,
        (countIf(status_code >= 500) / count()) * 100 AS error_rate
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

    return NextResponse.json(data as ErrorRateResponse[]);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json<ErrorRateResponse[]>([], { status: 500 });
  }
}
