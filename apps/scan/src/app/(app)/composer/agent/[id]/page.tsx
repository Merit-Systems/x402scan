import { notFound } from 'next/navigation';

import { Body } from '@/app/_components/layout/page-utils';

import { HeaderCard } from './_components/header';
import { Tools } from './_components/tools';
import { Activity } from './_components/activity';

import { api } from '@/trpc/server';

import type { Metadata } from 'next';

export default async function AgentPage({
  params,
}: PageProps<'/composer/agent/[id]'>) {
  const { id } = await params;

  const agentConfiguration = await api.public.agents.get(id);

  if (!agentConfiguration) {
    return notFound();
  }

  // Prefetch activity data for hydration
  void api.public.agents.activity.agent.bucketed.prefetch({
    agentConfigurationId: agentConfiguration.id,
  });

  return (
    <Body className="gap-8 pt-0">
      <HeaderCard agentConfiguration={agentConfiguration} />
      <Tools resources={agentConfiguration.resources} />
      <Activity agentConfiguration={agentConfiguration} />
    </Body>
  );
}

export const generateMetadata = async ({
  params,
}: PageProps<'/composer/agent/[id]'>): Promise<Metadata> => {
  const { id } = await params;
  const agentConfiguration = await api.public.agents.get(id);
  if (!agentConfiguration) {
    return { title: 'Agent not found' };
  }
  return {
    title: agentConfiguration.name,
    description: agentConfiguration.description,
  };
};
