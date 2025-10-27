'use client';

import { BaseResourceItem } from './base';

import type { RouterOutputs } from '@/trpc/client';
import type { SelectedResource } from '../../../_types/chat-config';

interface Props {
  resource: RouterOutputs['public']['tools']['search'][number];
  onSelectResource: (resource: SelectedResource) => void;
}

export const UnselectedResourceItem: React.FC<Props> = ({
  resource,
  onSelectResource,
}) => {
  return (
    <BaseResourceItem
      resource={resource}
      isSelected={false}
      onSelectResource={onSelectResource}
    />
  );
};
