import { Wallet } from 'lucide-react';

import { Breadcrumb } from '../../../../_components/breadcrumb';
import { Separator } from '../../../../_components/separator';

import { formatAddress } from '@/lib/utils';

interface Props {
  params: Promise<{ wallet: string }>;
  children: React.ReactNode;
}

export default async function AdminMcpUserBreadcrumbsLayout({
  params,
  children,
}: Props) {
  const { wallet } = await params;
  return (
    <>
      <Separator />
      <Breadcrumb
        href={`/admin/mcp/users/${wallet}` as any}
        image={null}
        name={formatAddress(wallet)}
        Fallback={Wallet}
      />
      {children}
    </>
  );
}
