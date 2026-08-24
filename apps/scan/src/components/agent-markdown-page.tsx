import { notFound } from 'next/navigation';

import { MarkdownContent } from './markdown-content';

import { getMarkdownPage } from '@/lib/agent/pages';

import type { Metadata } from 'next';

/**
 * Server-renders one of the agent-facing markdown pages (`/docs`, `/about`,
 * `/contact`, `/pricing`) with the same prose styling as the legal pages. The
 * markdown is the single source: the `text/markdown` variant of the page
 * serves exactly the same body.
 */
export async function AgentMarkdownPage({ path }: { path: string }) {
  const page = getMarkdownPage(path);
  if (!page) notFound();
  const content = await page.body();
  return <MarkdownContent content={content} />;
}

export function agentPageMetadata(path: string): Metadata {
  const page = getMarkdownPage(path);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: path,
      types: { 'text/markdown': `/md${path}` },
    },
  };
}
