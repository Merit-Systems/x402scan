import { ServerOff } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { ResourceCard, LoadingResourceCard } from './resource-card';

import { getBazaarMethod } from './utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  resources: RouterOutputs['public']['origins']['list']['withResources'][number]['resources'];
  hideOrigin?: boolean;
  isFlat?: boolean;
}

export const OriginResources: React.FC<Props> = ({
  resources,
  hideOrigin = false,
  isFlat = false,
}) => {
  const successfulResources = resources.filter(
    resource =>
      resource.success && resource.accepts && resource.accepts.length > 0
  );

  if (successfulResources.length === 0) {
    return (
      <Empty className="bg-card border mt-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ServerOff />
          </EmptyMedia>
          <EmptyTitle>No Resources</EmptyTitle>
          <EmptyDescription>No resources available</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="border-b-0 gap-0">
      {resources
        .filter(resource => resource.success)
        .map(resource => {
          const rawOutputSchema = resource.accepts.find(
            accept => accept.outputSchema
          )?.outputSchema;
          const bazaarMethod = getBazaarMethod(rawOutputSchema);

          return (
            <ResourceCard
              key={resource.id}
              resource={resource}
              tags={resource.tags.map(tag => tag.tag)}
              bazaarMethod={bazaarMethod}
              className="bg-transparent"
              response={resource.data}
              hideOrigin={hideOrigin}
              isFlat={isFlat}
            />
          );
        })}
    </div>
  );
};

export const LoadingOriginResources = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <LoadingResourceCard key={index} />
      ))}
    </div>
  );
};
