import { AgenticCommerceContent } from './_components/content';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agentic Commerce APIs and Payments',
  description:
    'Learn how AI agents discover, pay for, and use APIs through x402 payments, discovery specs, and x402scan listings.',
  alternates: {
    canonical: '/agentic-commerce',
  },
};

export default function AgenticCommercePage() {
  return <AgenticCommerceContent />;
}
