import { NextResponse, type NextRequest } from 'next/server';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';

export async function GET(request: NextRequest) {
  const queryUrl = request.nextUrl.searchParams.get('url');
  if (!queryUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  let url: string;
  try {
    url = decodeURIComponent(queryUrl);
    // Validate URL
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: 'Invalid url parameter' },
      { status: 400 }
    );
  }

  // Strip the query params to mirror registration logic
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  try {
    const origin = getOriginFromUrl(cleanUrl);
    const {
      og,
      metadata,
      origin: scrapedOrigin,
    } = await scrapeOriginData(origin);

    const title = metadata?.title ?? og?.ogTitle ?? null;
    const description = metadata?.description ?? og?.ogDescription ?? null;
    const favicon = og?.favicon
      ? og.favicon.startsWith('/')
        ? scrapedOrigin.replace(/\/$/, '') + og.favicon
        : og.favicon
      : null;
    const ogImages = (og?.ogImage ?? []).map(image => ({
      url: image.url,
      height: image.height,
      width: image.width,
      title: og?.ogTitle,
      description: og?.ogDescription,
    }));

    return NextResponse.json(
      {
        preview: {
          title,
          description,
          favicon,
          ogImages,
          origin: scrapedOrigin,
        },
        // also return raw scraped for potential debugging/inspection
        og,
        metadata,
        origin: scrapedOrigin,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to build preview' },
      { status: 500 }
    );
  }
}
