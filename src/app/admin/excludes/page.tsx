import { Body, Heading } from '@/app/_components/layout/page-utils';
import { ResourceExcludesTable } from './_components/resource-excludes-table';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function ExcludesPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
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
