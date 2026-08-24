import { getMarkdownPage, notFoundMarkdown } from '@/lib/agent/pages';

import type { NextRequest } from 'next/server';

/**
 * Markdown representation of site pages.
 *
 * Reached via `Accept: text/markdown` content negotiation (rewritten here by
 * `src/proxy.ts`) or directly at `/md/<path>` (e.g. `/md/docs`). Unknown paths
 * return a Markdown 404 that points agents at the sitemap, llms.txt and docs.
 */
export const dynamic = 'force-dynamic';

const baseHeaders = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
  'Access-Control-Allow-Origin': '*',
} as const;

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/md/[[...slug]]'>
) {
  const { slug } = await ctx.params;
  const pathname = `/${(slug ?? []).join('/')}`;
  const page = getMarkdownPage(pathname);

  if (!page) {
    return new Response(notFoundMarkdown(pathname), {
      status: 404,
      headers: { ...baseHeaders, 'Cache-Control': 'no-store' },
    });
  }

  const body = await page.body();
  return new Response(body, {
    headers: {
      ...baseHeaders,
      'Content-Location': `/md${page.path === '/' ? '' : page.path}`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
