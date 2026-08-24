import {
  AgentMarkdownPage,
  agentPageMetadata,
} from '@/components/agent-markdown-page';

import type { Metadata } from 'next';

export const metadata: Metadata = agentPageMetadata('/contact');

export default function Page() {
  return <AgentMarkdownPage path="/contact" />;
}
