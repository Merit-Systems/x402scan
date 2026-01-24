import { Body, Heading } from '@/app/_components/layout/page-utils';
import { WalletDetails } from './_components/wallet-details';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

interface PageProps {
  params: Promise<{ wallet: string }>;
}

export default async function AdminUserPage({ params }: PageProps) {
  const session = await auth();
  const { wallet } = await params;

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  const truncatedWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  return (
    <div>
      <Heading
        title={`User ${truncatedWallet}`}
        description="View wallet balance and activity."
      />
      <Body>
        <WalletDetails wallet={wallet} />
      </Body>
    </div>
  );
}
