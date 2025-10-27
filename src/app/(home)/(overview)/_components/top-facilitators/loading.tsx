import { Section } from '@/app/_components/layout/page-utils';

import { LoadingFacilitatorCard } from './_components/card';

export const LoadingTopFacilitators = () => {
  return (
    <Section
      title="Top Facilitators"
      description="Analytics on facilitators processing x402 transfers"
      className="gap-4"
      href="/facilitators"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingFacilitatorCard key={index} />
        ))}
      </div>
    </Section>
  );
};
