import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import { NextResponse } from 'next/server';

interface StatusCodesRequest {
  originUrl: string;
  resourceUrl?: string;
  startDate: string;
  endDate: string;
  bucketMinutes: number;
}

interface StatusCodesResponse {
  ts: string;
  r_2xx: number;
  r_3xx: number;
  r_4xx: number;
  r_5xx: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<StatusCodesResponse[]>> {
  try {
    const { originUrl, resourceUrl, startDate, endDate, bucketMinutes } =
      (await request.json()) as StatusCodesRequest;

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
        sumIf(1, status_code BETWEEN 200 AND 299) AS r_2xx,
        sumIf(1, status_code BETWEEN 300 AND 399) AS r_3xx,
        sumIf(1, status_code BETWEEN 400 AND 499) AS r_4xx,
        sumIf(1, status_code >= 500) AS r_5xx
      FROM resource_invocations
      WHERE created_at >= t_start
        AND created_at <= t_end
        AND ${urlCondition}
      GROUP BY ts
      ORDER BY ts
    `;

    const resultSet = await clickhouse.query({
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

    return NextResponse.json(data as StatusCodesResponse[]);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json<StatusCodesResponse[]>([], { status: 500 });
  }
}
