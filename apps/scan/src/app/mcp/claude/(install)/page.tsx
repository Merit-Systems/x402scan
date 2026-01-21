import { Body } from '@/app/_components/layout/page-utils';
import { ClientIcon } from '../../_components/clients/icons';
import { Clients } from '../../_components/clients/data';
import { Logo } from '@/components/logo';
import { ChevronsLeftRight } from 'lucide-react';
import { ClaudeAccordion } from './_components/accordion';

export default function ClaudePage() {
  return (
    <Body className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <Logo className="size-12" />
          <ChevronsLeftRight className="size-6 text-muted-foreground/60" />
          <ClientIcon
            client={Clients.Claude}
            className="size-12 fill-[#c15f3c]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Add x402scan MCP to Claude</h1>
          <p className="text-muted-foreground/80 text-lg">
            Experiment with building x402-powered agents and tools.
          </p>
        </div>
      </div>
      <ClaudeAccordion />
    </Body>
  );
}
