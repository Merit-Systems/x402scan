import { User, Wallet } from 'lucide-react';

import { Breadcrumb } from '../../_components/breadcrumb';

import { formatAddress } from '@/lib/utils';
import { Separator } from '../../_components/separator';

export default async function BuyerBreadcrumbLayout({
  params,
  children,
}: LayoutProps<'/buyer/[address]'>) {
  const { address } = await params;
  return (
    <>
      <Separator />
      <Breadcrumb
        href={`/buyer/${address}`}
        image={null}
        name="Buyer"
        Fallback={User}
      />
      <Separator className="hidden md:block" />
      <Breadcrumb
        href={`/buyer/${address}`}
        image={null}
        name={formatAddress(address)}
        Fallback={Wallet}
        mobileHideImage
        className="hidden md:block"
      />
      {children}
    </>
  );
}
