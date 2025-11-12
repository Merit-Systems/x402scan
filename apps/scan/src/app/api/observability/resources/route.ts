import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { originUrl, startDate, endDate } = await request.json();

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

    const resultSet = await clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await resultSet.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources data' },
      { status: 500 }
    );
  }
}
