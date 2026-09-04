import { Subnav } from "../../_components/layout/subnav";

export default async function RecipientLayout({
  params,
  children,
}: LayoutProps<"/recipient/[address]">) {
  const { address } = await params;
  return (
    <div className="flex flex-1 flex-col">
      <Subnav
        tabs={[
          {
            label: "Overview",
            href: `/recipient/${address}`,
          },
          {
            label: "Resources",
            href: `/recipient/${address}/resources`,
          },
          {
            label: "Transactions",
            href: `/recipient/${address}/transactions`,
          },
        ]}
      />
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
