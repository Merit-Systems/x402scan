import { cache, Suspense } from "react";

import { notFound } from "next/navigation";

import { Body } from "@/app/(app)/_components/deferred/page-utils";
import { api } from "@/trpc/server";

import { Activity, LoadingActivity } from "./_components/activity";
import { HeaderCard, LoadingHeaderCard } from "./_components/header";
import { Tools, LoadingTools } from "./_components/tools";

import type { Metadata } from "next";

const getAgent = cache(
  async (params: PageProps<"/composer/agent/[id]">["params"]) => {
    const { id } = await params;
    const agent = await api.public.agents.get(id);
    if (!agent) notFound();
    return agent;
  }
);

export default function AgentPage({
  params,
}: PageProps<"/composer/agent/[id]">) {
  return (
    <Body className="gap-8 pt-0">
      <Suspense fallback={<LoadingHeaderCard />}>
        <AgentHeader params={params} />
      </Suspense>
      <Suspense fallback={<LoadingTools />}>
        <AgentTools params={params} />
      </Suspense>
      <Suspense fallback={<LoadingActivity />}>
        <AgentActivity params={params} />
      </Suspense>
    </Body>
  );
}

async function AgentHeader({
  params,
}: Pick<PageProps<"/composer/agent/[id]">, "params">) {
  return <HeaderCard agentConfiguration={await getAgent(params)} />;
}

async function AgentTools({
  params,
}: Pick<PageProps<"/composer/agent/[id]">, "params">) {
  const agent = await getAgent(params);
  return <Tools resources={agent.resources} />;
}

async function AgentActivity({
  params,
}: Pick<PageProps<"/composer/agent/[id]">, "params">) {
  const agent = await getAgent(params);
  void api.public.agents.activity.agent.bucketed.prefetch({
    agentConfigurationId: agent.id,
  });
  return <Activity agentConfiguration={agent} />;
}

export const generateMetadata = async ({
  params,
}: PageProps<"/composer/agent/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const agentConfiguration = await api.public.agents.get(id);
  if (!agentConfiguration) {
    return { title: "Agent not found" };
  }
  return {
    title: agentConfiguration.name,
    description: agentConfiguration.description,
  };
};
