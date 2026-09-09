import { forbidden } from "next/navigation";

import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { ResourceMetadataTable } from "./_components/resource-metadata-table";

export default async function RequestMetadataPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Resource Request Metadata"
        description="Manage request metadata for resources including headers, body, query parameters, and input schema."
      />
      <Body>
        <ResourceMetadataTable />
      </Body>
    </div>
  );
}
