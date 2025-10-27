'use client';

import { api } from '@/trpc/client';

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

  if (!tool) {
    return null;
  }

  return (
    <BaseResourceItem
      resource={tool[0]}
      isSelected={true}
      onSelectResource={onSelectResource}
    />
  );
};
