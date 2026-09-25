import { Nav } from "../../_components/layout/nav";

export default async function BuyerLayout({
  params,
  children,
}: LayoutProps<"/buyer/[address]">) {
  const { address } = await params;
  return (
    <div className="flex flex-1 flex-col">
      <Nav
        tabs={[
          {
            label: "Overview",
            href: `/buyer/${address}`,
          },
          {
            label: "Transactions",
            href: `/buyer/${address}/transactions`,
          },
        ]}
      />
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
