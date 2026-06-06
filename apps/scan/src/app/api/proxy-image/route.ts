import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    const blockedPatterns =
      /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.|::1|\[::1\]|\[?::ffff:|\[?f[cd][0-9a-f]{2}:)/i;
    if (blockedPatterns.test(parsed.hostname)) {
      return NextResponse.json({ error: 'Blocked host' }, { status: 403 });
    }

    const res = await fetch(url, {
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    });

    // Validate final URL after redirects against SSRF blocklist
    if (res.url && res.url !== url) {
      const finalHost = new URL(res.url).hostname;
      if (blockedPatterns.test(finalHost)) {
        return NextResponse.json({ error: 'Blocked redirect target' }, { status: 403 });
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream fetch failed' },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') ?? 'image/png';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > maxSize) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
