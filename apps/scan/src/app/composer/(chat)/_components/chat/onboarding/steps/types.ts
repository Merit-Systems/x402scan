import type { StepType } from '@/components/ui/stepper';

export type OnboardingStep = StepType & {
  component: React.ReactNode;
  heading: string;
  description: string;
};
