'use client';

import { useEffect, useState } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { ResourcesTable } from './resources-table';
import { Skeleton } from '@/components/ui/skeleton';

interface ResourceData {
  url: string;
  total_requests: string;
  error_count: string;
  avg_duration: string;
  last_seen: string;
}

interface Props {
  originUrl: string;
}

const LoadingResourcesTable = () => {
  return (
    <div className="w-full">
      <div className="mb-4">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="border rounded-lg p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
};

export const ResourcesTableWrapper: React.FC<Props> = ({ originUrl }) => {
  const { startDate, endDate } = useTimeRangeContext();
  const [data, setData] = useState<ResourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/observability/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originUrl,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch resources data');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching resources data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, originUrl]);

  if (isLoading) {
    return <LoadingResourcesTable />;
  }

  return <ResourcesTable data={data} />;
};
