'use client';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { api } from '@/trpc/client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { steps } from './steps';
import { Stepper } from '@/components/ui/stepper';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { agentConfigurationSchema } from '@/services/db/agent-config/mutate/schema';
import type z from 'zod';

interface Props {
  initialStep?: number;
  initialResourceIds?: string[];
}

export const CreateAgentForm: React.FC<Props> = ({
  initialStep = 0,
  initialResourceIds = [],
}) => {
  const router = useRouter();

  const [step, setStep] = useState(initialStep);

  const form = useForm({
    resolver: zodResolver(agentConfigurationSchema),
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      resourceIds: [],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    form.setValue('resourceIds', initialResourceIds, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [initialResourceIds, form]);

  const { mutate: createAgent, isPending: isSubmitting } =
    api.user.agentConfigurations.create.useMutation({
      onSuccess: agentConfiguration => {
        toast.success('Agent configuration created successfully');
        router.push(`/composer/agent/${agentConfiguration.id}/chat`);
      },
      onError: error => {
        toast.error(error.message);
      },
    });

  const handleSubmit = (data: z.infer<typeof agentConfigurationSchema>) => {
    createAgent(data);
  };

  const onNext = useCallback(() => {
    setStep(prev => prev + 1);
  }, [setStep]);

  const onPrevious = useCallback(() => {
    setStep(prev => prev - 1);
  }, [setStep]);

  const stepsConfig = useMemo(
    () => steps({ onNext, onPrevious, form, isSubmitting }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onNext, onPrevious, form, isSubmitting, form.formState]
  );

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4"
    >
      <Stepper steps={stepsConfig} currentStep={step} />
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted border-b">
          <CardTitle>{stepsConfig[step].card.title}</CardTitle>
          <CardDescription>
            {stepsConfig[step].card.description}
          </CardDescription>
        </CardHeader>
        {stepsConfig[step].component}
      </Card>
    </form>
  );
};
