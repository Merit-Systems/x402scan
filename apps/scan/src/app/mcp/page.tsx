import { ClientDemos } from './_components/client-demos';
import { Hero } from './_components/hero';

export default function McpPage() {
  return (
    <div className="flex flex-col gap-36 py-16 px-4 max-w-7xl mx-auto w-full">
      <Hero />
      <ClientDemos />
    </div>
  );
}
