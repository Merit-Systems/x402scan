import { Check } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem as AccordionItemPrimitive,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

export interface BaseStep {
  title: string;
  content: React.ReactNode;
  continueText: string;
  onNext?: () => Promise<void>;
  nextDisabled?: boolean;
}

export interface Step extends Omit<BaseStep, 'onNext'> {
  onNext: () => void | Promise<void>;
}

interface Props extends Step {
  index: number;
  currentStep: number;
}

export const AccordionItem: React.FC<Props> = ({
  index,
  title,
  content,
  continueText,
  currentStep,
  onNext,
  nextDisabled,
}) => {
  const isCompleted = currentStep > index;

  return (
    <AccordionItemPrimitive
      value={index.toString()}
      className="w-full border rounded-lg last:border-b p-4"
    >
      <AccordionTrigger className="w-full flex items-center justify-start gap-4 hover:no-underline py-0">
        <div
          className={cn(
            'size-6 rounded-full border border-muted bg-muted text-muted-foreground flex items-center justify-center',
            (currentStep === index || isCompleted) &&
              'border-primary text-white bg-primary'
          )}
        >
          {isCompleted ? <Check className="size-4 text-white" /> : index + 1}
        </div>
        <h2 className="text-lg font-semibold shrink-0">{title}</h2>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-0 flex flex-col gap-4">
        {content}
        <div className="flex items-center justify-start gap-2 w-full">
          {onNext && (
            <Button
              className="flex-1"
              onClick={() => void onNext?.()}
              disabled={nextDisabled}
            >
              {continueText}
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItemPrimitive>
  );
};
