import { ArrowLeftRight } from 'lucide-react';

import { Breadcrumb } from '../../_components/breadcrumb';

import { formatAddress } from '@/lib/utils';
import { Separator } from '../../_components/separator';

export default async function TransactionBreadcrumbLayout({
  params,
  children,
}: LayoutProps<'/transaction/[hash]'>) {
  const { hash } = await params;
  return (
    <>
      <Separator />
      <Breadcrumb
        href={`/transaction/${hash}`}
        image={null}
        name={formatAddress(hash)}
        Fallback={ArrowLeftRight}
        mobileHideImage
      />
      {children}
    </>
  );
}
