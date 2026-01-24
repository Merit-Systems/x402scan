import { Body, Heading } from '@/app/_components/layout/page-utils';
import { McpUsersTable } from './_components/table';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function McpUsersPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="MCP Users"
        description="Users who have redeemed invite codes."
      />
      <Body>
        <McpUsersTable />
      </Body>
    </div>
  );
}
