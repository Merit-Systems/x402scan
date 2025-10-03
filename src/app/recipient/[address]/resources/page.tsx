import { Body, Heading } from '@/app/_components/layout/page-utils';
import { ResourceExecutor } from '@/app/_components/resource-executor';
import { getBazaarMethod } from '@/app/_components/resource-executor/utils';
import { api, HydrateClient } from '@/trpc/server';
import { OriginCard } from './_components/origin';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage({
  params,
}: PageProps<'/recipient/[address]/resources'>) {
  const { address } = await params;

  const originsWithResources = await api.origins.list.withResources(address);

  return (
    <HydrateClient>
      <Heading
        title="Resources"
        description="Resources provided by this address grouped by server origin"
      />
      <Body className="gap-0">
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
      </Body>
    </HydrateClient>
  );
}
