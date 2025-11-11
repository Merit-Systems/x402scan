import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { SearchContainer } from './_components/search-container';

export default async function ResourceSearchPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <div>
      <Heading
        title="Resource Search"
        description="AI-powered search to find and analyze resources across the platform."
      />
      <Body>
        <SearchContainer />
      </Body>
    </div>
  );
}
