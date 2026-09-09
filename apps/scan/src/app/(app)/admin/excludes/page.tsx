import { forbidden } from "next/navigation";

import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { ResourceExcludesTable } from "./_components/resource-excludes-table";

export default async function ExcludesPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Excluded Resources"
        description="Manage resources that should be excluded from agent use."
      />
      <Body>
        <ResourceExcludesTable />
      </Body>
    </div>
  );
}
