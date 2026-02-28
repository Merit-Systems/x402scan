'use client';

import { useMemo, useState } from 'react';

import { ChevronDownIcon } from 'lucide-react';

import { Accordion } from '../../_components/accordion';

import {
  Accordion as AccordionPrimitive,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

import { toast } from 'sonner';

import { CopyButton } from '@/components/ui/copy-button';

import { McpbDisplay } from './steps/mcpb';

import { Clients } from '@/app/mcp/_lib/clients';

import type { McpSearchParams } from '@/app/mcp/_lib/params';
import type { BaseStep } from '../../_components/accordion/item';

export const ClaudeAccordion: React.FC<McpSearchParams> = ({ invite }) => {
  const [hasDownloadedMcpb, setHasDownloadedMcpb] = useState(false);

  const steps: BaseStep[] = useMemo(
    () => [
      {
        title: 'Install Claude Desktop',
        content: (
          <p>
            Go to the{' '}
            <a
              href="https://claude.ai/download"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              Claude Desktop
            </a>{' '}
            website and download the latest version for your operating system.
          </p>
        ),
        continueText: 'I Have Claude Desktop',
      },
      {
        title: 'Download the x402scan Extension',
        content: (
          <p>
            The x402scan MCP is available as a{' '}
            <a
              href="https://www.anthropic.com/engineering/desktop-extensions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              Claude Desktop Extension
            </a>
            . Download it to continue the installation.
          </p>
        ),
        continueText: hasDownloadedMcpb ? 'Continue' : 'Download',
        onNext: async () => {
          if (hasDownloadedMcpb) {
            return Promise.resolve();
          }
          return await fetch('/x402scan.mcpb')
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'x402.mcpb');
              document.body.appendChild(link);
              link.click();
              link.parentNode?.removeChild(link);
              window.URL.revokeObjectURL(url);
              setHasDownloadedMcpb(true);
            })
            .catch(err => {
              toast.error(
                `Failed to download the MCP: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            });
        },
      },
      {
        title: 'Open the Downloaded File',
        content: (
          <div className="flex flex-col gap-2">
            <McpbDisplay />
            <AccordionPrimitive type="single" collapsible>
              <AccordionItem value="faq">
                <AccordionTrigger className="text-muted-foreground pt-1 pb-0 items-center">
                  <span>Why does claude warn about installing MCPB files?</span>
                  <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" />
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="bg-muted p-2 rounded-lg flex flex-col gap-2">
                    <p>
                      Claude Desktop will warn that{' '}
                      <span className="italic font-medium">
                        &quot;Installing will grant access to everything on your
                        computer.&quot;
                      </span>
                    </p>
                    <p>
                      While this is true for all local MCP servers, x402scan
                      only uses the{' '}
                      <span className="font-mono border rounded-md px-1">
                        .x402scan
                      </span>{' '}
                      folder to store data.
                    </p>
                    <p>
                      You can verify this by checking the{' '}
                      <a
                        href="https://github.com/Merit-Systems/agentcash/tree/main/packages/external/mcp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline"
                      >
                        Source Code
                      </a>{' '}
                      of the x402scan MCP.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </AccordionPrimitive>
          </div>
        ),
        continueText: "I've Installed the MCP",
      },
      ...(invite
        ? [
            {
              title: 'Redeem Invite Code',
              content: (
                <div className="flex flex-col gap-2">
                  <p>
                    Paste the following prompt into a new chat window to redeem
                    your invite code:
                  </p>
                  <div className="bg-muted p-2 rounded-lg flex justify-between items-center gap-2">
                    <p>Redeem my invite code {invite} on the x402scan MCP</p>
                    <CopyButton
                      text={`Redeem my invite code ${invite} on the x402scan MCP`}
                    />
                  </div>
                </div>
              ),
              continueText: 'Next',
            },
          ]
        : []),
    ],
    [hasDownloadedMcpb, invite]
  );

  return <Accordion steps={steps} client={Clients.Claude} />;
};
