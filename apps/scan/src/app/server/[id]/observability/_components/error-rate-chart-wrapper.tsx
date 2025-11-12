'use client';

import { ErrorRateChart } from './error-rate-chart';
import { LoadingChart } from './loading-chart';
import { useObservabilityData } from './use-observability-data';

interface ErrorRateData {
  ts: string;
  total_requests: string;
  error_requests: string;
  error_rate: string;
}

interface Props {
  originUrl: string;
  resourceUrl?: string;
}

export const ErrorRateChartWrapper: React.FC<Props> = ({
  originUrl,
  resourceUrl,
}) => {
  const { data, isLoading } = useObservabilityData<ErrorRateData>({
    endpoint: '/api/observability/error-rate',
    originUrl,
    resourceUrl,
  });

  if (isLoading) {
    return <LoadingChart legendItems={[{ label: 'Server Error Rate' }]} />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No error rate data available
      </div>
    );
  }

  return <ErrorRateChart data={data} />;
};
