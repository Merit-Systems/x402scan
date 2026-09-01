import { Subnav } from "../../_components/layout/subnav";

export default async function RecipientLayout({
  params,
  children,
}: LayoutProps<"/facilitator/[id]">) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col">
      <Subnav
        tabs={[
          {
            label: "Overview",
            href: `/facilitator/${id}`,
          },
          {
            label: "Transactions",
            href: `/facilitator/${id}/transactions`,
          },
        ]}
      />
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
