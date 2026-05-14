import { PAGE_MARKDOWN } from '@/app/(app)/(home)/discovery/architecture/_content/markdown';

export function GET() {
  return new Response(PAGE_MARKDOWN, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
