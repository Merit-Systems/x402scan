export default function RecipientLayout({
  children,
}: LayoutProps<"/recipient/[address]">) {
  return <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>;
}
