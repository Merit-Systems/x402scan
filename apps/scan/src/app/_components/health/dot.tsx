'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateHealthStatus } from './utils';
import { HEALTH_CONFIG } from './constants';
import { HealthTooltipContent } from './tooltip';
import { type HealthMetrics } from './types';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

type Props = {
  metrics?: HealthMetrics | null;
  originId?: string;
};

export const HealthDot: React.FC<Props> = ({ metrics, originId }) => {
  const status = calculateHealthStatus(metrics);
  const { color } = HEALTH_CONFIG[status];
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (originId) {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/server/${originId}/observability` as Route);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'shrink-0 rounded-full size-2 animate-pulse hover:scale-125 transition-transform',
            originId && 'cursor-pointer',
            color,
            'bg-current'
          )}
          onClick={handleClick}
          role="button"
          tabIndex={0}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <HealthTooltipContent status={status} metrics={metrics} />
      </TooltipContent>
    </Tooltip>
  );
};
