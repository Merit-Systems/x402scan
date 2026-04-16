'use client';

import { useDiscoverSearch } from './discover-search-context';
import { DiscoverSearchResults } from './discover-search';

interface Props {
  children: React.ReactNode;
}

/**
 * Switches between default home content and search results.
 */
export const DiscoverPageContent = ({ children }: Props) => {
  const { isSearching } = useDiscoverSearch();

  if (isSearching) {
    return <DiscoverSearchResults />;
  }

  return <>{children}</>;
};
