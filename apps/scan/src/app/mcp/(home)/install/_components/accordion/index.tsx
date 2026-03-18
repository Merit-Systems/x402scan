'use client';

import { useMemo, useState } from 'react';

import { Accordion as AccordionPrimitive } from '@/components/ui/accordion';

import { AccordionItem } from './item';

import { useGetStarted } from './get-started-prompt';

import type { BaseStep, Step } from './item';
import type { McpSearchParams } from '@/app/mcp/_lib/params';
import type { Clients } from '@/app/mcp/_lib/clients';

interface Props extends McpSearchParams {
  steps: BaseStep[];
  client: Clients;
}

export const Accordion: React.FC<Props> = ({ steps: stepsProp, client }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const goToNextStep = () => setCurrentStep(prev => prev + 1);

  const getStartedStep = useGetStarted(client);

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
      getStartedStep,
    ],
    [stepsProp, getStartedStep]
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
            currentStep={currentStep}
            {...step}
          />
        ))}
      </AccordionPrimitive>
    </>
  );
};
