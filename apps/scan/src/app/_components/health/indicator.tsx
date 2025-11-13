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
import type { HealthMetrics } from './types';

interface Props {
  metrics?: HealthMetrics | null;
}

export const HealthIndicator: React.FC<Props> = ({ metrics }) => {
  const status = calculateHealthStatus(metrics);
  const { Icon, color, bgColor, borderColor, label } = HEALTH_CONFIG[status];

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1 py-0.5 rounded-full border',
        'text-xs font-medium cursor-default',
        bgColor,
        borderColor
      )}
    >
      <Icon className={cn('size-3', color)} />
      <span className={cn(color, 'text-xs')}>{label}</span>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom">
        <HealthTooltipContent status={status} metrics={metrics} />
      </TooltipContent>
    </Tooltip>
  );
};
