import { Body, Heading } from "@/app/(app)/_components/layout/page-utils";

import { CreateAgentForm } from "../../../_components/new-agent/form";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
        <CreateAgentForm initialStep={session ? 1 : 0} />
      </Body>
    </div>
  );
}
