import React from "react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="flex w-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  ? () => {
                      setCurrentStep(index);
                    }
                  : undefined
              }
              {...step}
            />
            {index < steps.length - 1 && (
              <Progress
                className={cn(" min-w-4 shrink ", index < currentStep && "")}
                value={index < currentStep ? 100 : 0}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile step indicator */}
      {currentStepData?.title && (
        <div className="flex items-center justify-center py-2 md:hidden">
          <div
            className={cn(
              "type-card-title text-foreground",
              currentStepData.activeClassName
            )}
          >
            {currentStepData.title}
          </div>
        </div>
      )}
    </div>
  );
};

type StepProps = {
  isActive: boolean;
  isCompleted: boolean;
  className?: string;
  completedClassName?: string;
  activeClassName?: string;
  onClick?: () => void;
} & StepType;

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
    <Button
      type="button"
      variant="plain"
      size="none"
      disabled={!onClick}
      className={cn(
        "flex items-center shrink-0",
        onClick && "cursor-pointer",
        isActive && "flex-1"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "size-fit p-2 rounded-full flex items-center justify-center border border-current dark:border-current transition-colors duration-300 opacity-20",
          className,
          (isCompleted || isActive) && "opacity-100",
          isCompleted &&
            cn(
              "bg-primary border-primary dark:border-primary text-primary-foreground",
              completedClassName
            ),
          isActive && cn("border-primary text-primary", activeClassName)
        )}
      >
        {icon}
      </div>
      {title && (
        <span
          className={cn(
            "type-label max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,padding] duration-50 ease-in-out md:block hidden",
            isActive &&
              "max-w-[200px] opacity-100 pl-2 duration-300 delay-50 text-primary"
          )}
        >
          {title}
        </span>
      )}
    </Button>
  );
};
