import { OriginCard } from '@/app/_components/resources/origin';
import { ResourceExecutor } from './executor';

import { getBazaarMethod } from './executor/utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  originsWithResources: RouterOutputs['origins']['list']['withResources']['byAddress'];
}

export const ResourcesByOrigin: React.FC<Props> = ({
  originsWithResources,
}) => {
  console.log(originsWithResources);
  return (
    <div>
      {originsWithResources.map((origin, index) => (
        <div key={origin.id}>
          <OriginCard origin={origin} />
          <div className="pl-4">
            {origin.resources.map(resource => (
              <div key={resource.id} className="pt-4 pl-4 border-l relative">
                <div className="absolute left-0 top-[calc(2rem+10px)] w-4 h-[1px] bg-border" />
                <ResourceExecutor
                  resource={resource}
                  bazaarMethod={getBazaarMethod(
                    resource.accepts[0].outputSchema
                  )}
                  className="bg-transparent"
                  response={resource.data}
                />
              </div>
            ))}
            {index < originsWithResources.length - 1 ? (
              <div className="h-4 w-[1px] bg-border" />
            ) : (
              <div className="size-3 bg-border rounded-full -ml-[5px]" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
