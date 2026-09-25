import { redirect } from "next/navigation";

import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { CreateAgentForm } from "../../../_components/new-agent/form";

export default async function NewAgentPage() {
  const session = await auth();

  if (!session) {
    return redirect("/composer/agents/new");
  }

  return (
    <div className="relative flex h-0 w-full flex-1 flex-col overflow-y-auto py-8 md:py-12">
      <Heading
        title="Create an Agent"
        description="Design an agent with x402 resources and custom behavior."
        className="md:max-w-2xl"
      />
      <Body className="max-w-2xl">
        <CreateAgentForm initialStep={1} />
      </Body>
    </div>
  );
}
