import { ServerOff } from 'lucide-react';

import { Accordion } from '@/components/ui/accordion';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { LoadingResourceExecutor, ResourceExecutor } from './executor';

import { getBazaarMethod } from './executor/utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  resources: RouterOutputs['public']['origins']['list']['withResources'][number]['resources'];
  defaultOpen?: boolean;
  hideOrigin?: boolean;
  isFlat?: boolean;
}

export const OriginResources: React.FC<Props> = ({
  resources,
  defaultOpen = false,
  hideOrigin = false,
  isFlat = false,
}) => {
  return (
    <Accordion
      type="multiple"
      className="border-b-0"
      defaultValue={
        defaultOpen ? resources.map(resource => resource.id) : undefined
      }
    >
      {resources.filter(
        resource =>
          resource.data &&
          resource.accepts &&
          resource.accepts.length > 0 &&
          resource.accepts[0].outputSchema
      ).length > 0 ? (
        resources.map(resource => (
          <ResourceExecutor
            key={resource.id}
            resource={resource}
            tags={resource.tags.map(tag => tag.tag)}
            bazaarMethod={getBazaarMethod(resource.accepts[0].outputSchema)}
            className="bg-transparent"
            response={resource.data}
            hideOrigin={hideOrigin}
            defaultOpen={defaultOpen}
            isFlat={isFlat}
          />
        ))
      ) : (
        <Empty className="bg-card border mt-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ServerOff />
            </EmptyMedia>
            <EmptyTitle>No Resources</EmptyTitle>
            <EmptyDescription>No resources available</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Accordion>
  );
};

export const LoadingOriginResources = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <LoadingResourceExecutor key={index} />
      ))}
    </div>
  );
};
