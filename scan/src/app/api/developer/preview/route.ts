import { NextResponse } from 'next/server';

import { scrapeOriginData } from '@/services/scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const origin = new URL(url).origin;
    const data = await scrapeOriginData(origin);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Invalid URL' },
      { status: 400 }
    );
  }
}
