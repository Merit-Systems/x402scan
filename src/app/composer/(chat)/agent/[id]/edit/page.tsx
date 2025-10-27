import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { api } from '@/trpc/server';

import { notFound, unauthorized } from 'next/navigation';
import { EditAgentForm } from './_components/edit-form';
import { DeleteAgentButton } from './_components/delete';

export default async function EditAgentPage({
  params,
}: PageProps<'/composer/agent/[id]/edit'>) {
  const session = await auth();

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;

  const agentConfiguration = await api.public.agents.get(id);

  if (!agentConfiguration) {
    return notFound();
  }

  if (agentConfiguration.ownerId !== session.user.id) {
    return unauthorized();
  }

  return (
    <div className="flex w-full flex-1 h-0 flex-col pt-8 md:pt-12 overflow-y-auto relative">
      <Heading title="Edit Agent" className="md:max-w-2xl" />
      <Body className="max-w-2xl">
        <EditAgentForm agentConfiguration={agentConfiguration} />
        <DeleteAgentButton agentId={id} />
      </Body>
    </div>
  );
}
