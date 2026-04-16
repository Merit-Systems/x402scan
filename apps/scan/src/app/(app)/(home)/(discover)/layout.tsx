import { DiscoverSearchProvider } from './_components/discover-search-context';

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DiscoverSearchProvider>{children}</DiscoverSearchProvider>;
}
