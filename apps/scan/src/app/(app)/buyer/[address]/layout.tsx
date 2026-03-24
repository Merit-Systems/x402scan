import { Nav } from '../../_components/layout/nav';

export default async function BuyerLayout({
  params,
  children,
}: LayoutProps<'/buyer/[address]'>) {
  const { address } = await params;
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/buyer/${address}`,
          },
          {
            label: 'Transactions',
            href: `/buyer/${address}/transactions`,
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
