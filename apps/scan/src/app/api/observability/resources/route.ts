import { analyticsDb } from '@x402scan/analytics-db';
import { NextResponse } from 'next/server';

interface ResourcesRequest {
  originUrl: string;
  startDate: string;
  endDate: string;
}

interface ResourcesResponse {
  id: string;
  url: string;
  total_requests: number;
  error_count: number;
  avg_duration: number;
  last_seen: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<ResourcesResponse[]>> {
  try {
    const { originUrl, startDate, endDate } =
      (await request.json()) as ResourcesRequest;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const query = `
      SELECT
        url,
        count() AS total_requests,
        countIf(status_code >= 400) AS error_count,
        avg(duration) AS avg_duration,
        max(created_at) AS last_seen
      FROM resource_invocations
      WHERE created_at >= toDateTime('${start.toISOString().replace('T', ' ').split('.')[0]}')
        AND created_at <= toDateTime('${end.toISOString().replace('T', ' ').split('.')[0]}')
        AND url LIKE '%${originUrl}%'
      GROUP BY url
      ORDER BY total_requests DESC
      LIMIT 100
    `;

    const resultSet = await analyticsDb.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();

    return NextResponse.json(data as ResourcesResponse[]);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json<ResourcesResponse[]>([], { status: 500 });
  }
}
