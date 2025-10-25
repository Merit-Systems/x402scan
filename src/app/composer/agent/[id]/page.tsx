import { Body } from '@/app/_components/layout/page-utils';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { HeaderCard } from './_components/header';
import { Tools } from './_components/tools';
import { Activity } from './_components/activity';

export default async function AgentPage({
  params,
}: PageProps<'/composer/agent/[id]'>) {
  const { id } = await params;

  const agentConfiguration = await api.public.agents.get(id);

  if (!agentConfiguration) {
    return notFound();
  }

  return (
    <Body className="gap-8 pt-0">
      <HeaderCard agentConfiguration={agentConfiguration} />
      <Tools resources={agentConfiguration.resources} />
      <Activity agentConfiguration={agentConfiguration} />
    </Body>
  );
}
