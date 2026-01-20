'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Code } from '@/components/ui/code';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, FileCode2, X } from 'lucide-react';

import { ClientDemosSection } from './section';
import { ClientTypes } from '../../../_components/clients/data';

export const IdeDemo = () => {
  return (
    <ClientDemosSection
      heading="In Your IDE"
      description="Seamlessly integrate paid APIs into your coding workflow with automatic micropayments."
      cta={
        <Button size="xl" className="w-fit font-semibold">
          Add to Cursor
        </Button>
      }
      graphic={<IdeGraphic />}
      imageSide="left"
      clientType={ClientTypes.IDE}
    />
  );
};

const codeContent = `import { createClient } from '@x402/client';

const client = createClient({
  wallet: process.env.WALLET_KEY,
});

async function enrichCompany(domain: string) {
  const result = await client.fetch(
    'https://enrichx402.com/api/company',
    {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }
  );

  return result.json();
}

// Usage
const data = await enrichCompany('acme.co');
console.log(data);`;

const IdeGraphic = () => {
  return (
    <div className="flex h-96 bg-background rounded-xl overflow-hidden border border-border/50">
      {/* File tabs */}
      <div className="flex flex-col flex-1 overflow-hidden w-0">
        <div className="flex items-center bg-muted/50 border-b border-border/50">
          <div className="flex items-center gap-2 px-3 py-2 bg-background border-r border-border/50 text-xs">
            <FileCode2 className="size-3.5 text-blue-400" />
            <span className="text-foreground">enrichment.ts</span>
            <X className="size-3 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <File className="size-3.5" />
            <span>index.ts</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="w-full overflow-x-auto max-w-full">
            <Code value={codeContent} lang="typescript" />
          </div>
        </ScrollArea>
      </div>

      {/* Code area */}

      {/* Right: Chat Panel */}
      <div className="w-64 flex flex-col bg-card border-l border-border/50">
        {/* Chat content */}
        <ScrollArea className="flex-1 h-0">
          <div className="p-3 flex flex-col gap-3 text-xs">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-card border rounded-xl px-3 py-2 max-w-[90%]">
                Can you help me enrich company data for acme.co?
              </div>
            </div>

            {/* Assistant response */}
            <div className="text-muted-foreground leading-relaxed">
              I&apos;ll use the x402 enrichment API to fetch company data.
            </div>

            {/* Tool call */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
                <Logo className="size-3.5" />
                <span className="font-semibold text-xs">x402scan MCP</span>
              </div>

              <div className="p-3 flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    Provider
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    EnrichX402
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                    Resource
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    Company Enrichment
                  </span>
                </div>
              </div>
            </div>

            {/* Result preview */}
            <div className="text-muted-foreground leading-relaxed">
              Found company data for Acme Corp. They have 150 employees and are
              based in San Francisco.
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
