import { SquareUserRound, Wallet, Wrench } from 'lucide-react';
import { ConnectStep } from './connect';

import { ToolsStep } from './tools';
import { DisplayStep } from './display';
import type { CreateAgentStep, NewAgentForm } from './types';

interface StepProps {
  onNext: () => void;
  onPrevious: () => void;
  form: NewAgentForm;
  isSubmitting: boolean;
}

export const steps = ({
  onNext,
  onPrevious,
  form,
  isSubmitting,
}: StepProps): CreateAgentStep[] => [
  {
    icon: <Wallet className="size-4" />,
    title: 'Sign In',
    component: <ConnectStep />,
    card: {
      title: 'Sign In With Your Wallet',
      description:
        'Your wallet will serve as your account and authorize you to create and edit your agents.',
    },
  },
  {
    icon: <Wrench className="size-4" />,
    title: 'Tools',
    component: <ToolsStep form={form} onNext={onNext} />,
    card: {
      title: 'Add Tools',
      description:
        'Select which x402 resources you want your agent to have access to.',
    },
  },
  {
    icon: <SquareUserRound className="size-4" />,
    title: 'Display',
    component: (
      <DisplayStep
        form={form}
        onPrevious={onPrevious}
        isSubmitting={isSubmitting}
      />
    ),
    card: {
      title: 'Display Your Agent',
      description: 'Choose how your agent will be displayed to you and others.',
    },
  },
];
