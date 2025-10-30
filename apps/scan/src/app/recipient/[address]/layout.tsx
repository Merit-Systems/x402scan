import { Nav } from '../../_components/layout/nav';

export default async function RecipientLayout({
  params,
  children,
}: LayoutProps<'/recipient/[address]'>) {
  const { address } = await params;
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/recipient/${address}`,
          },
          {
            label: 'Resources',
            href: `/recipient/${address}/resources`,
          },
          {
            label: 'Transactions',
            href: `/recipient/${address}/transactions`,
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
