import { Button } from '@/components/ui/button';
import { ClientSelect } from '../lib/client-select';

export const Contact = () => {
  return (
    <div className="bg-muted px-4 md:px-16 py-8 items-start md:items-center flex flex-col md:flex-row justify-between rounded-xl gap-4">
      <h1 className="text-xl md:text-2xl font-bold">
        Exploring Agentic Commerce?
      </h1>
      <div className="flex gap-2">
        <ClientSelect text="Try the MCP" />
        <a href="mailto:info@x402scan.com">
          <Button
            variant="outline"
            size="xl"
            className="w-fit font-semibold px-4 md:px-8 text-sm md:text-base"
          >
            Contact Us
          </Button>
        </a>
      </div>
    </div>
  );
};
