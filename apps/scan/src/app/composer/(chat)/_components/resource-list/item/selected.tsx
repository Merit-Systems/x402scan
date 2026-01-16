'use client';

import { AlertTriangle } from 'lucide-react';

import { api } from '@/trpc/client';
import { CommandItem } from '@/components/ui/command';

import { BaseResourceItem, LoadingBaseResourceItem } from './base';

import type { SelectedResource } from '../../../_types/chat-config';

interface Props {
  id: string;
  onSelectResource: (resource: SelectedResource) => void;
}

export const SelectedResourceItem: React.FC<Props> = ({
  id,
  onSelectResource,
}) => {
  const { data: tool, isLoading: isToolLoading } =
    api.public.tools.search.useQuery({
      resourceIds: [id],
      limit: 1,
    });

  if (isToolLoading) {
    return <LoadingBaseResourceItem />;
  }

  const firstTool = tool?.[0];

  if (!firstTool) {
    return (
      <CommandItem
        onSelect={() => onSelectResource({ id, favicon: '' })}
        className="flex items-center justify-between gap-3 rounded-none px-3"
        value={id}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <AlertTriangle className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-1 flex-col items-start gap-0 overflow-hidden">
            <h3 className="text-sm font-semibold line-clamp-1 w-full max-w-full truncate">
              Unsupported resource
            </h3>
            <p className="text-[10px] text-muted-foreground line-clamp-2">
              {id}
            </p>
          </div>
        </div>
      </CommandItem>
    );
  }

  return (
    <BaseResourceItem
      resource={firstTool}
      isSelected={true}
      onSelectResource={onSelectResource}
    />
  );
};
