import { Hero } from './_components/1-hero';
import { ClientDemos } from './_components/2-client-demos';
import { Integrations } from './_components/3-integrations';

export default function McpPage() {
  return (
    <div className="flex flex-col gap-24 md:gap-36 py-12 md:py-16 px-4 max-w-full md:max-w-7xl mx-auto w-full">
      <Hero />
      <ClientDemos />
      <Integrations />
    </div>
  );
}
