import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { originUrl, startDate, endDate, bucketMinutes } =
      await request.json();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const query = `
      WITH
        toDateTime('${end.toISOString().replace('T', ' ').split('.')[0]}') AS t_end,
        toDateTime('${start.toISOString().replace('T', ' ').split('.')[0]}') AS t_start,
        toIntervalMinute(${bucketMinutes}) AS bucket

      SELECT
        toStartOfInterval(created_at, bucket) AS ts,
        sumIf(1, status_code BETWEEN 200 AND 299) AS r_2xx,
        sumIf(1, status_code BETWEEN 300 AND 399) AS r_3xx,
        sumIf(1, status_code BETWEEN 400 AND 499) AS r_4xx,
        sumIf(1, status_code >= 500) AS r_5xx
      FROM resource_invocations
      WHERE created_at >= t_start
        AND created_at <= t_end
        AND url LIKE '%${originUrl}%'
      GROUP BY ts
      ORDER BY ts
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
      { error: 'Failed to fetch observability data' },
      { status: 500 }
    );
  }
}
