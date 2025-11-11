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

interface Props {
  metrics?: HealthMetrics | null;
}

export const HealthDot: React.FC<Props> = ({ metrics }) => {
  const status = calculateHealthStatus(metrics);
  const { color } = HEALTH_CONFIG[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'shrink-0 rounded-full size-2 animate-pulse',
            color,
            'bg-current'
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <HealthTooltipContent status={status} metrics={metrics} />
      </TooltipContent>
    </Tooltip>
  );
};
