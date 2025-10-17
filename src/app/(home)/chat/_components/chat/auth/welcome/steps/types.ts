import type { StepType } from '@/components/ui/stepper';

export interface WelcomeStep extends StepType {
  component: React.ReactNode;
}
