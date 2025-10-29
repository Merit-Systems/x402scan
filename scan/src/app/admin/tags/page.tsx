import { Body, Heading } from '@/app/_components/layout/page-utils';
import { ResourceTable } from './_components/resource-table';
import { ResourceCharts } from './_components/resource-charts';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function ResourcesPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <div>
      <Heading
        title="Resource Tagging"
        description="Tag resources with categories to help users find them."
      />
      <Body>
        <ResourceCharts />
        <div className="mt-8">
          <ResourceTable />
        </div>
      </Body>
    </div>
  );
}
