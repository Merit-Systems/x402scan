import { Body, Heading } from "@/app/(app)/_components/layout/page-utils";
import { LoadingAgentsTable } from "@/app/(app)/composer/agents/(table)/_components/table/table";

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
