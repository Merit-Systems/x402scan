import { Body } from '../_components/layout/page-utils';
import { ClientSelect } from './_components/client-select';
import { Cta } from './_components/cta';
import { HeroGraphic } from './_components/graphic/graphic';

export default function McpPage() {
  return (
    <Body className="max-w-lg mx-auto gap-20 py-16">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 items-center justify-center text-center">
          <h1 className="text-6xl font-semibold">x402scan MCP</h1>
          <p className="text-xl text-muted-foreground/60 font-mono">
            Give your agents the ability to make paid API requests to any x402 endpoint.
          </p>
        </div>
        <Cta />
      </div>
      <HeroGraphic />
      <ClientSelect />
    </Body>
  );
}
