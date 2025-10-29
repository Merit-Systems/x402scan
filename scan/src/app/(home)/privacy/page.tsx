import { MarkdownPage } from '@/components/markdown-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'x402scan Privacy Policy - Learn how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return <MarkdownPage filename="privacy.md" />;
}
