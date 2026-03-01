import { MarkdownPage } from '@/components/markdown-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery Spec',
  description:
    'x402scan discovery and registration specification for endpoint-only, well-known fan-out, and OpenAPI-first integrations.',
};

export default function DiscoverySpecPage() {
  return <MarkdownPage filename="discovery.md" />;
}
