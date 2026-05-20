import { DiscoverSearchProvider } from './_components/discover-search-context';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DiscoverSearchProvider>{children}</DiscoverSearchProvider>;
}
