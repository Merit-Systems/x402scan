import { NextResponse } from 'next/server';

import { negotiateFormat } from '@/lib/agent/accept';

import type { NextRequest } from 'next/server';

/**
 * Markdown content negotiation (https://acceptmarkdown.com).
 *
 * For page requests whose `Accept` header prefers `text/markdown` over
 * `text/html`, rewrite to the `/md/<path>` route handler, which serves the
 * Markdown representation (or a Markdown 404). Every negotiated HTML response
 * gets `Vary: Accept` so CDNs never hand the HTML variant to an agent asking
 * for Markdown, or vice versa (the HTML side is declared in next.config.ts
 * `headers()`). Requests that accept neither get a 406.
 *
 * Excluded: Next internals, static files, API routes, the PostHog reverse
 * proxy, and `/md` itself.
 */
export const config = {
  matcher: [
    '/((?!_next/|api/|ingest/|md/|md$|\\.well-known/|.*\\.[A-Za-z0-9]+$).*)',
  ],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only GET/HEAD page loads are negotiable; let navigations, RSC fetches and
  // form posts through untouched.
  const isPageLoad =
    (request.method === 'GET' || request.method === 'HEAD') &&
    !request.headers.has('rsc') &&
    !request.headers.has('next-router-prefetch');

  if (!isPageLoad) return NextResponse.next();

  const format = negotiateFormat(request.headers.get('accept'));

  if (format === 'not-acceptable') {
    return new NextResponse(
      'Not Acceptable: this resource is available as text/html or text/markdown.\n',
      {
        status: 406,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          Vary: 'Accept',
        },
      }
    );
  }

  if (format === 'markdown') {
    const url = request.nextUrl.clone();
    url.pathname = `/md${pathname === '/' ? '' : pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set('Vary', 'Accept');
    return response;
  }

  // `Vary: Accept` for the HTML variant is added by `headers()` in
  // next.config.ts; the renderer overwrites anything set on this response.
  return NextResponse.next();
}
