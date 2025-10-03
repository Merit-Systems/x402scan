import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { ResourceExecutor } from '../../_components/resource-executor';
import { getBazaarMethod } from '@/app/_components/resource-executor/utils';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const resources = await api.resources.list.all();

  return (
    <div>
      <Heading title="All Resources" />
      <Body>
        <div className="space-y-4">
          <div className="space-y-3">
            {resources.map(resource => (
              <ResourceExecutor
                key={resource.id}
                resource={resource}
                bazaarMethod={getBazaarMethod(resource.accepts[0].outputSchema)}
              />
            ))}
          </div>
        </div>
      </Body>
    </div>
  );
}
