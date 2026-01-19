import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Clients } from '../lib/clients/data';
import { ClientDemosSection } from './section';

export const ClaudeDesktopDemo = () => {
  return (
    <ClientDemosSection
      heading="In Claude Desktop"
      description="Use powerful APIs to build agents for knowledge work."
      cta={
        <Button size="xl" className="w-fit font-semibold">
          Get Started
        </Button>
      }
      graphic={<ChatGraphic />}
      imageSide="left"
      clients={[Clients.Claude]}
    />
  );
};

const ChatGraphic = () => {
  return (
    <div className="p-8 flex flex-col gap-4 text-sm overflow-hidden">
      <div className="flex justify-end">
        <div className="bg-card border rounded-2xl px-4 py-3 max-w-[80%]">
          I am looking to franchise my coffee shop in Austin TX. Can you help me
          find contact details for current shops in the area to learn more?
        </div>
      </div>

      {/* Assistant response */}
      <div className="leading-relaxed">
        I can help you research coffee shops in Austin, TX! Let me start by
        finding coffee shops in the area using location-based search.
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Logo className="size-4" />
          <span className="font-semibold">x402scan MCP</span>
        </div>

        <div className="p-4 flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-medium font-mono text-muted-foreground/60">
              Provider
            </h3>
            <p className="text-sm text-primary font-bold">Google Maps API</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-medium font-mono text-muted-foreground/60">
              Resource
            </h3>
            <p className="text-sm font-bold text-primary">
              Full Location Search
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
