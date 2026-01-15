'use client';

import { useEffect, useState } from 'react';

import { Section } from '@/app/_components/layout/page-utils';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { VerifiedFilterDialog } from './verified-filter-dialog';

export const TopServersContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.shiftKey && e.metaKey) {
        e.preventDefault();
        setShowModal(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
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
      <VerifiedFilterDialog open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
