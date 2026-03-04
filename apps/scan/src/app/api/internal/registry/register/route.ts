import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { POST as handler } from '@/app/api/data/registry/register/route';
import { env } from '@/env';

export const POST = async (request: NextRequest) => {
  if (env.NEXT_PUBLIC_NODE_ENV !== 'development') {
    const key = env.INTERNAL_API_KEY;
    if (!key || request.headers.get('x-api-key') !== key) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  return handler(request);
};
