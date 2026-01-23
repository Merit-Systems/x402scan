import { Body, Heading } from '@/app/_components/layout/page-utils';
import { CreateInviteCodeButton } from './_components/create-modal';
import { WalletInfo } from './_components/wallet-info';
import { InviteCodesTable } from './_components/table';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function InviteCodesPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Invite Codes"
        description="Create and manage invite codes that reward users with USDC."
        actions={<CreateInviteCodeButton />}
      />
      <Body>
        <WalletInfo />
        <InviteCodesTable />
      </Body>
    </div>
  );
}
