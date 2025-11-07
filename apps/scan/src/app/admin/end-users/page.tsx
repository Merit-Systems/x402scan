import { Body, Heading } from '@/app/_components/layout/page-utils';
import { EndUsersTable } from './_components/table';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function EndUsersPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <div>
      <Heading
        title="CDP End Users"
        description="View and export all end users from Coinbase Developer Platform."
      />
      <Body>
        <EndUsersTable />
      </Body>
    </div>
  );
}
