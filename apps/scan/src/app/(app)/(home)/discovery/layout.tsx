export default function DiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-slot="documentation">{children}</div>;
}
