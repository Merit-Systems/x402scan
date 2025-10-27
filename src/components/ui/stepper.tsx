import React from 'react';

import { Progress } from '@/components/ui/progress';

import { cn } from '@/lib/utils';

export interface StepType {
  icon: React.ReactNode;
  title?: string;
  className?: string;
  completedClassName?: string;
  activeClassName?: string;
}

interface Props {
  steps: StepType[];
  currentStep: number;
  setCurrentStep?: (step: number) => void;
  stepClassName?: string;
  completedStepClassName?: string;
  activeStepClassName?: string;
}

export const Stepper: React.FC<Props> = ({
  steps,
  currentStep,
  setCurrentStep,
  stepClassName,
  completedStepClassName,
  activeStepClassName,
}) => {
  const currentStepData = steps[currentStep];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-hide">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Step
              isActive={index === currentStep}
              isCompleted={index < currentStep}
              className={stepClassName}
              completedClassName={completedStepClassName}
              activeClassName={activeStepClassName}
              onClick={
                setCurrentStep && index < currentStep
                  ? () => setCurrentStep(index)
                  : undefined
              }
              {...step}
            />
            {index < steps.length - 1 && (
              <Progress
                className={cn(
                  'h-[2px] min-w-4 shrink bg-border opacity-50',
                  index < currentStep && 'opacity-100'
                )}
                value={index < currentStep ? 100 : 0}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile step indicator */}
      {currentStepData?.title && (
        <div className="md:hidden flex items-center justify-center py-2">
          <span
            className={cn(
              'font-bold text-base text-foreground',
              currentStepData.activeClassName
            )}
          >
            {currentStepData.title}
          </span>
        </div>
      )}
    </div>
  );
};

interface StepProps extends StepType {
  isActive: boolean;
  isCompleted: boolean;
  className?: string;
  completedClassName?: string;
  activeClassName?: string;
  onClick?: () => void;
}

const Step: React.FC<StepProps> = ({
  title,
  icon,
  isActive,
  isCompleted,
  className,
  completedClassName,
  activeClassName,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'flex items-center shrink-0',
        onClick && 'cursor-pointer',
        isActive && 'flex-1'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'size-fit p-2 rounded-full flex items-center justify-center border border-current dark:border-current transition-colors duration-300 opacity-20',
          className,
          (isCompleted || isActive) && 'opacity-100',
          isCompleted &&
            cn(
              'bg-primary border-primary dark:border-primary text-white',
              completedClassName
            ),
          isActive && cn('border-primary text-primary', activeClassName)
        )}
      >
        {icon}
      </div>
      {title && (
        <span
          className={cn(
            'font-bold text-sm max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,padding] duration-50 ease-in-out md:block hidden',
            isActive &&
              'max-w-[200px] opacity-100 pl-2 duration-300 delay-50 text-primary'
          )}
        >
          {title}
        </span>
      )}
    </div>
  );
};
