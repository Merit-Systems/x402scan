import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import { clickhouse } from '@/services/db/clickhouse/resource-invocations';
import { StatusChart } from './_components/status-chart';
import { DateSelector } from './_components/date-selector';

export default async function ObservabilityPage({
  params,
  searchParams,
}: PageProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return notFound();
  }

  // Get time range from search params (default to 1 day)
  const resolvedSearchParams = await searchParams;
  const rangeDays = parseInt(resolvedSearchParams?.range || '1');
  const rangeHours = rangeDays * 24;

  // Calculate bucket size based on range (more days = larger buckets)
  let bucketMinutes = 10;
  if (rangeDays >= 15) {
    bucketMinutes = 60; // 1 hour buckets for 15+ days
  } else if (rangeDays >= 7) {
    bucketMinutes = 30; // 30 min buckets for 7+ days
  } else if (rangeDays >= 3) {
    bucketMinutes = 15; // 15 min buckets for 3+ days
  }

  // Run ClickHouse query
  let statusData: Array<{
    ts: string;
    r_2xx: string;
    r_3xx: string;
    r_4xx: string;
    r_5xx: string;
  }> = [];

  try {
    const query = `
      WITH
        now()                                 AS t_end,
        t_end - INTERVAL ${rangeHours} HOUR   AS t_start,
        toIntervalMinute(${bucketMinutes})    AS bucket

      SELECT
        toStartOfInterval(created_at, bucket) AS ts,
        sumIf(1, status_code BETWEEN 200 AND 299) AS r_2xx,
        sumIf(1, status_code BETWEEN 300 AND 399) AS r_3xx,
        sumIf(1, status_code BETWEEN 400 AND 499) AS r_4xx,
        sumIf(1, status_code >= 500)             AS r_5xx
      FROM resource_invocations
      WHERE created_at >= t_start
        AND created_at <= t_end
        AND url LIKE '%${origin.origin}%'
      GROUP BY ts
      ORDER BY ts
    `;

    const resultSet = await clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    statusData = await resultSet.json();
    console.log('ClickHouse observability data:', statusData);
  } catch (error) {
    console.error('ClickHouse query error:', error);
  }

  return (
    <Body className="pt-0">
      <div className="mb-6">
        <DateSelector />
      </div>
      {statusData.length > 0 ? (
        <StatusChart data={statusData} />
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No observability data available
        </div>
      )}
    </Body>
  );
}
