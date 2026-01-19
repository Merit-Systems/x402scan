'use client';

import { Section } from '@/app/_components/layout/page-utils';
import { RangeSelector } from '@/app/_contexts/time-range/component';

export const TopServersContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Top Servers"
      description="Top addresses that have received x402 transfers and are listed in the Bazaar"
      actions={
        <div className="flex items-center gap-2">
          <RangeSelector />
        </div>
      }
    >
      {children}
    </Section>
  );
};
