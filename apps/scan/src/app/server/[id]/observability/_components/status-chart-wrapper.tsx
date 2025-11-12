'use client';

import { StatusChart } from './status-chart';
import { LoadingChart } from './loading-chart';
import { useObservabilityData } from './use-observability-data';

interface StatusCodeData {
  ts: string;
  r_2xx: string;
  r_3xx: string;
  r_4xx: string;
  r_5xx: string;
}

interface Props {
  originUrl: string;
  resourceUrl?: string;
}

export const StatusChartWrapper: React.FC<Props> = ({
  originUrl,
  resourceUrl,
}) => {
  const { data, isLoading } = useObservabilityData<StatusCodeData>({
    endpoint: '/api/observability/status-codes',
    originUrl,
    resourceUrl,
  });

  if (isLoading) {
    return (
      <LoadingChart
        legendItems={[
          { label: '2XX' },
          { label: '3XX' },
          { label: '4XX' },
          { label: '5XX' },
        ]}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No observability data available
      </div>
    );
  }

  return <StatusChart data={data} />;
};
