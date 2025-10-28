'use client';

import { useEffect, useState } from 'react';
import { getHostnameFromOrigin } from '@/lib/tscore';
import { Skeleton } from '@/components/ui/skeleton';

interface TScoreProps {
  origin: string;
}

export function TScore({ origin }: TScoreProps) {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = getHostnameFromOrigin(origin);
    
    fetch(`https://x402-secure-api.t54.ai/api/servers/by-name/${hostname}/latest-score`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.overall_score === 'number') {
          setScore(data.overall_score);
        }
      })
      .catch(() => {
        setScore(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [origin]);

  if (isLoading) {
    return <Skeleton className="h-4 w-12 mx-auto" />;
  }

  return (
    <div className="text-center font-mono text-xs">
      {score !== null ? score.toFixed(1) : '-'}
    </div>
  );
}

