import { Check } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

export interface Step {
  title: string;
  content: React.ReactNode;
  continueText: string;
  onNext: () => void;
}

interface Props extends Step {
  index: number;
  currentStep: number;
  onPrevious?: () => void;
}

export const ClaudeAccordionItem: React.FC<Props> = ({
  index,
  title,
  content,
  continueText,
  currentStep,
  onNext,
  onPrevious,
}) => {
  const isCompleted = currentStep > index;

  return (
    <AccordionItem
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
        <div className="flex items-center justify-start gap-2">
          {onNext && <Button onClick={onNext}>{continueText}</Button>}
          {index > 0 && onPrevious && (
            <Button variant="outline" onClick={onPrevious}>
              Back
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
