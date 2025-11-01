import type { StepType } from '@/components/ui/stepper';
import type { agentConfigurationSchema } from '@/services/db/agent-config/mutate/schema';
import type { UseFormReturn } from 'react-hook-form';
import type z from 'zod';

export type CreateAgentStep = StepType & {
  component: React.ReactNode;
  card: {
    title: string;
    description: string;
  };
};

export type NewAgentForm = UseFormReturn<
  z.input<typeof agentConfigurationSchema>
>;
