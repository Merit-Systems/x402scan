import { Activity, Wrench } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Favicon } from '@/app/_components/favicon';

import { formatTokenAmount } from '@/lib/token';

import type { RouterOutputs } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  resource: RouterOutputs['public']['agents']['get']['resources'][number];
}

export const ToolCard: React.FC<Props> = ({ resource }) => {
  return (
    <Card>
      <CardHeader className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
          <div className="flex items-center gap-2 space-y-0 flex-1 overflow-hidden">
            <Favicon url={resource.favicon} Fallback={Wrench} />
            <CardTitle className="flex-1 truncate text-sm md:text-base">
              {resource.resource}
            </CardTitle>
            <span className="text-sm font-mono text-primary font-bold">
              {formatTokenAmount(BigInt(resource.accepts[0].maxAmountRequired))}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Activity className="size-3" />
            <p className="text-sm text-muted-foreground">
              {resource.usageCount}
            </p>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-xs md:text-sm">
          {resource.accepts[0].description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const LoadingToolCard = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 space-y-0">
            <Skeleton className="size-4" />
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-8 h-4" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
    </Card>
  );
};
