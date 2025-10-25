import { Body, Heading } from '@/app/_components/layout/page-utils';
import { ResourceMetadataTable } from './_components/resource-metadata-table';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function RequestMetadataPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
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
