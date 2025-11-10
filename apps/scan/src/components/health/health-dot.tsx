'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateHealthStatus } from './utils';
import { HEALTH_CONFIG } from './constants';
import { HealthTooltipContent } from './health-tooltip';
import type { HealthMetrics } from './types';

interface Props {
  metrics?: HealthMetrics | null;
}

export const HealthDot: React.FC<Props> = ({ metrics }) => {
  const status = calculateHealthStatus(metrics);
  const { Icon, color } = HEALTH_CONFIG[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="shrink-0">
          <Icon className={cn('size-3', color)} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <HealthTooltipContent status={status} metrics={metrics} />
      </TooltipContent>
    </Tooltip>
  );
};
