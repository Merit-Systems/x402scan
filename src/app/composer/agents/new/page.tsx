import { Body, Heading } from '@/app/_components/layout/page-utils';

import { CreateAgentForm } from '../../_components/new-agent/form';
import { auth } from '@/auth';

export default async function NewAgentPage() {
  const session = await auth();

  return (
    <div className="flex w-full flex-1 h-0 flex-col overflow-y-auto relative">
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
