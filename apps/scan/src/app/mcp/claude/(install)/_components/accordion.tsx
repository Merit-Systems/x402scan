'use client';

import { Accordion } from '@/components/ui/accordion';
import { useState } from 'react';
import { ClaudeAccordionItem } from './item';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

export const ClaudeAccordion = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasDownloadedMcpb, setHasDownloadedMcpb] = useState(false);

  const router = useRouter();

  return (
    <Accordion
      type="single"
      value={currentStep.toString()}
      className="space-y-4   "
    >
      <ClaudeAccordionItem
        index={0}
        title="Install Claude Desktop"
        content={
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
        }
        continueText="I Have Claude Desktop"
        onNext={() => setCurrentStep(prev => prev + 1)}
        onPrevious={() => setCurrentStep(prev => prev - 1)}
        currentStep={currentStep}
      />
      <ClaudeAccordionItem
        index={1}
        title="Download the x402scan Extension"
        content={
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
        }
        continueText={hasDownloadedMcpb ? 'Continue' : 'Download'}
        onNext={() => {
          if (hasDownloadedMcpb) {
            setCurrentStep(prev => prev + 1);
            return;
          }
          void fetch('/x402scan.mcpb')
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'x402scan.mcpb');
              document.body.appendChild(link);
              link.click();
              link.parentNode?.removeChild(link);
              window.URL.revokeObjectURL(url);
              setHasDownloadedMcpb(true);
              setCurrentStep(prev => prev + 1);
            })
            .catch(err => {
              toast.error(
                `Failed to download the MCP: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            });
        }}
        onPrevious={() => setCurrentStep(prev => prev - 1)}
        currentStep={currentStep}
      />
      <ClaudeAccordionItem
        index={2}
        title="Open the Downloaded File"
        content={
          <div className="flex flex-col gap-2">
            <p>Open the downloaded file to install the MCP on Claude Desktop</p>
            <div className="bg-muted p-2 rounded-lg flex flex-col gap-2">
              <p className="font-semibold text-xs">Note</p>
              <p>
                Claude Desktop will warn that{' '}
                <span className="italic font-medium">
                  &quot;Installing will grant access to everything on your
                  computer.&quot;
                </span>
              </p>
              <p>
                While this is true for all local MCP servers, x402scan only uses
                the{' '}
                <span className="font-mono border rounded-md px-1">
                  .x402scan
                </span>{' '}
                folder to store data.
              </p>
              <p>
                You can verify this by checking the{' '}
                <a
                  href="https://github.com/Merit-Systems/x402scan/tree/main/packages/external/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline"
                >
                  Source Code
                </a>{' '}
                of the x402scan MCP.
              </p>
            </div>
          </div>
        }
        continueText="I've Installed the MCP"
        onNext={() => setCurrentStep(prev => prev + 1)}
        onPrevious={() => setCurrentStep(prev => prev - 1)}
        currentStep={currentStep}
      />
      <ClaudeAccordionItem
        index={3}
        title="Start Exploring x402"
        content={
          <p>
            You can now access all x402-powered resources through the x402scan
            MCP!
          </p>
        }
        continueText="I'm Ready to Explore"
        onNext={() =>
          router.push(
            '/mcp/getting-started' as Route<'mcp/claude/getting-started'>
          )
        }
        onPrevious={() => setCurrentStep(prev => prev - 1)}
        currentStep={currentStep}
      />
    </Accordion>
  );
};
