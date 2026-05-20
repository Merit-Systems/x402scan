import { X402Content } from './_components/content';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'x402 Explorer, Transactions, Servers, and Marketplace',
  description:
    'Explore x402 payments, transactions, servers, facilitators, and paid APIs across the x402 ecosystem.',
  alternates: {
    canonical: '/x402',
  },
};

export default function X402Page() {
  return <X402Content />;
}
