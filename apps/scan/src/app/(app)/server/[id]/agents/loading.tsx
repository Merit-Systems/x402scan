import { Body, Heading } from "@/app/_components/layout/page-utils";
import { LoadingAgentsTable } from "@/app/(app)/_components/agents/table/table";

export default function LoadingAgents() {
  return (
    <div className="flex flex-1 flex-col py-6 md:py-8">
      <Heading
        title="Agents"
        description="Agents using resources from this origin"
      />
      <Body>
        <LoadingAgentsTable />
      </Body>
    </div>
  );
}
