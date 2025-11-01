'use client';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { api } from '@/trpc/client';

import { AgentForm } from './form';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  agentConfiguration: NonNullable<RouterOutputs['public']['agents']['get']>;
}

export const EditAgentForm: React.FC<Props> = ({ agentConfiguration }) => {
  const router = useRouter();

  const { mutate: createAgent, isPending } =
    api.user.agentConfigurations.update.useMutation({
      onSuccess: agentConfiguration => {
        toast.success('Agent configuration updated successfully');
        router.push(`/composer/agent/${agentConfiguration.id}`);
      },
      onError: error => {
        toast.error(error.message);
      },
    });

  return (
    <AgentForm
      onSubmit={data => {
        createAgent({
          ...data,
          id: agentConfiguration.id,
        });
      }}
      isSubmitting={isPending}
      submitText={{
        default: 'Update Agent',
        submitting: 'Updating...',
      }}
      defaultValues={{
        name: agentConfiguration.name,
        description: agentConfiguration.description ?? undefined,
        image: agentConfiguration.image ?? undefined,
        model: agentConfiguration.model ?? undefined,
        systemPrompt: agentConfiguration.systemPrompt,
        visibility: agentConfiguration.visibility,
        resourceIds: agentConfiguration.resources.map(resource => resource.id),
        starterPrompts: agentConfiguration.starterPrompts,
      }}
    />
  );
};
