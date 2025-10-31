import { MarkdownPage } from '@/components/markdown-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'x402scan Terms of Service - Read our terms and conditions for using the platform.',
};

export default function TermsOfServicePage() {
  return <MarkdownPage filename="tos.md" />;
}
