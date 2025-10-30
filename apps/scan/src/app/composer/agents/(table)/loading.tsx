import { Body, Heading } from '@/app/_components/layout/page-utils';
import { LoadingAgentsTable } from '@/app/_components/agents/table/table';

export default function LoadingAgents() {
  return (
    <div>
      <Heading
        title="Agents"
        description="Discover the most popular agents on x402scan"
      />
      <Body>
        <LoadingAgentsTable />
      </Body>
    </div>
  );
}
