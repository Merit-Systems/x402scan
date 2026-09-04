import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";
import { api } from "@/trpc/server";

import { notFound, unauthorized } from "next/navigation";
import { EditAgentForm } from "./_components/edit-form";
import { DeleteAgentButton } from "./_components/delete";

export default async function EditAgentPage({
  params,
}: PageProps<"/composer/agent/[id]/edit">) {
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
    <div className="relative flex h-0 w-full flex-1 flex-col overflow-y-auto pt-8 md:pt-12">
      <Heading title="Edit Agent" className="md:max-w-2xl" />
      <Body className="max-w-2xl">
        <EditAgentForm agentConfiguration={agentConfiguration} />
        <DeleteAgentButton agentId={id} />
      </Body>
    </div>
  );
}
