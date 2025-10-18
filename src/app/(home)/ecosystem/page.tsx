import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ecosystemCategories } from '@/lib/ecosystem/schema';
import { EcosystemList } from './_components/list';
import { EcosystemItems } from '@/lib/ecosystem/constants';

export default function EcosystemPage() {
  return (
    <div>
      <Heading
        title="Ecosystem"
        description="Projects registered in the coinbase/x402 repository."
      />
      <Body>
        <Tabs defaultValue="all">
          <TabsList className="flex flex-wrap gap-2 justify-start w-fit p-1">
            <TabsTrigger value="all" variant="underline">
              All
            </TabsTrigger>
            {ecosystemCategories.map(category => (
              <TabsTrigger key={category} value={category} variant="underline">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all">
            <EcosystemList items={EcosystemItems} showBadge />
          </TabsContent>
          {ecosystemCategories.map(category => (
            <TabsContent key={category} value={category}>
              <EcosystemList
                items={EcosystemItems.filter(
                  item => item.category === category
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Body>
    </div>
  );
}
