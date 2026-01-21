'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Accordion } from '@/components/ui/accordion';

import { ClaudeAccordionItem } from './item';

import type { Route } from 'next';
import type { Step } from './item';
import type { McpSearchParams } from '@/app/mcp/_lib/params';
import { CopyButton } from '@/components/ui/copy-button';

export const ClaudeAccordion: React.FC<McpSearchParams> = ({ invite }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [hasDownloadedMcpb, setHasDownloadedMcpb] = useState(false);

  const router = useRouter();

  const goToNextStep = () => setCurrentStep(prev => prev + 1);
  const goToPreviousStep = () => setCurrentStep(prev => prev - 1);

  const steps: Step[] = useMemo(
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
        onNext: goToNextStep,
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
        onNext: () => {
          if (hasDownloadedMcpb) {
            goToNextStep();
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
              goToNextStep();
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
        ),
        continueText: "I've Installed the MCP",
        onNext: goToNextStep,
      },
      ...(invite
        ? [
            {
              title: 'Redeem Invite Code',
              content: (
                <div className="flex flex-col gap-2">
                  <p>Paste the following prompt into a new chat window:</p>
                  <div className="bg-muted p-2 rounded-lg flex justify-between items-center gap-2">
                    <p>Redeem my invite code {invite} on the x402scan MCP</p>
                    <CopyButton
                      text={`Redeem my invite code ${invite} on the x402scan MCP`}
                    />
                  </div>
                </div>
              ),
              continueText: 'Next',
              onNext: () => {
                goToNextStep();
              },
            },
          ]
        : []),
      {
        title: 'Start Exploring x402',
        content: (
          <p>
            You can now access all x402-powered resources through the x402scan
            MCP!
          </p>
        ),
        continueText: "I'm Ready to Explore",
        onNext: () =>
          router.push(
            '/mcp/getting-started' as Route<'mcp/claude/getting-started'>
          ),
      },
    ],
    [hasDownloadedMcpb, router, invite]
  );

  return (
    <Accordion
      type="single"
      value={currentStep.toString()}
      onValueChange={value => setCurrentStep(Number(value))}
      className="space-y-4"
    >
      {steps.map((step, index) => (
        <ClaudeAccordionItem
          key={index}
          index={index}
          title={step.title}
          content={step.content}
          continueText={step.continueText}
          onNext={step.onNext}
          onPrevious={goToPreviousStep}
          currentStep={currentStep}
        />
      ))}
    </Accordion>
  );
};
