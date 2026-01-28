'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Accordion as AccordionPrimitive } from '@/components/ui/accordion';

import { CopyPrompt } from '@/app/mcp/_components/copy-prompt';

import { AccordionItem } from './item';

import { clients } from '@/app/mcp/_lib/clients';

import type { BaseStep, Step } from './item';
import type { McpSearchParams } from '@/app/mcp/_lib/params';
import type { Clients } from '@/app/mcp/_lib/clients';
import type { Route } from 'next';

interface Props extends McpSearchParams {
  steps: BaseStep[];
  client: Clients;
}

export const Accordion: React.FC<Props> = ({ steps: stepsProp, client }) => {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(0);

  const goToNextStep = () => setCurrentStep(prev => prev + 1);
  const goToPreviousStep = () => setCurrentStep(prev => prev - 1);

  const clientName = clients[client].name;

  const steps: Step[] = useMemo(
    () => [
      ...stepsProp.map(step => ({
        ...step,
        onNext: step.onNext
          ? () => {
              void step.onNext?.().then(() => {
                goToNextStep();
              });
            }
          : () => {
              goToNextStep();
            },
      })),
      {
        title: 'Run your First Enrichment Query',
        content: (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              Paste this prompt into {clientName} to see the MCP in action:
            </p>
            <CopyPrompt
              prompt={`Use the enrichment tools to find the emails of the founders of Merit Systems.`}
            />
          </div>
        ),
        continueText: 'It Works!',
        onNext: () =>
          router.push(
            `/mcp/install/${client}/complete` as Route<'/mcp/install/[client]/complete'>
          ),
      },
    ],
    [stepsProp, clientName, client, router]
  );

  return (
    <>
      <AccordionPrimitive
        type="single"
        value={currentStep.toString()}
        onValueChange={value => setCurrentStep(Number(value))}
        className="space-y-4"
      >
        {steps.map((step, index) => (
          <AccordionItem
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
      </AccordionPrimitive>
    </>
  );
};
