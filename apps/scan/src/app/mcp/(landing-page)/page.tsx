import { Hero } from './_components/1-hero';
import { ClientDemos } from './_components/2-client-demos';
import { Integrations } from './_components/3-integrations';
import { Contact } from './_components/4-contact';
import { mcpSearchParamsSchema } from '../_lib/params';

export default async function McpPage({ searchParams }: PageProps<'/mcp'>) {
  const parsed = mcpSearchParamsSchema.safeParse(await searchParams);

  return (
    <div className="flex flex-col gap-24 md:gap-36 py-12 md:py-16 px-4 max-w-full md:max-w-7xl mx-auto w-full">
      <Hero {...parsed.data} />
      <ClientDemos {...parsed.data} />
      <Integrations />
      <Contact />
    </div>
  );
}
