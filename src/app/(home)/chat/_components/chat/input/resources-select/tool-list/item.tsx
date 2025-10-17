import { Activity } from 'lucide-react';

import { CommandItem as BaseCommandItem } from '@/components/ui/command';

import { Favicon } from '@/app/_components/favicon';

import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { RouterOutputs } from '@/trpc/client';
import type { SelectedResource } from '@/app/(home)/chat/_lib/types';

interface Props {
  isSelected: boolean;
  resource: RouterOutputs['availableTools']['search'][number];
  onSelectResource: (resource: SelectedResource) => void;
}

export const ResourceItem: React.FC<Props> = ({
  resource,
  isSelected,
  onSelectResource,
}) => {
  return (
    <BaseCommandItem
      onSelect={() =>
        onSelectResource({ id: resource.id, favicon: resource.favicon })
      }
      className="flex items-center justify-between gap-3 rounded-none px-3"
      value={resource.resource}
    >
      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        <div
          className={cn('rounded-md overflow-hidden relative shrink-0 size-6')}
        >
          <Favicon url={resource.favicon} className="size-full" />
        </div>

        <div className="flex flex-1 flex-col items-start gap-0 overflow-hidden">
          <h3
            className={cn(
              'text-sm font-semibold line-clamp-1 w-full max-w-full truncate',
              isSelected && 'text-primary'
            )}
          >
            {resource.resource}
          </h3>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        </div>
      </div>
      {resource.invocations > 0 && (
        <div className="flex items-center gap-0.5 font-semibold">
          <Activity className="size-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {resource.invocations}
          </p>
        </div>
      )}
      <p className="text-xs text-primary font-bold">
        {formatTokenAmount(BigInt(resource.maxAmountRequired))}
      </p>
    </BaseCommandItem>
  );
};
