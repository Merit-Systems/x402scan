import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { env } from '@/env';
import { searchResourcesCombined } from '@/services/resource-search/combined-search';
import type { QueryMode, RefinementMode } from '@/services/resource-search/types';

const searchSchema = z.object({
  q: z.string().min(1),
  queryMode: z.enum(['keywords', 'sql', 'sql-parallel']).optional().default('keywords'),
  refinementMode: z.enum(['none', 'llm', 'reranker', 'both']).optional().default('none'),
});

export const GET = async (request: NextRequest) => {
  // 1. Authentication
  const apiKey = request.headers.get('x-api-key');
  if (!env.RESOURCE_SEARCH_API_KEY || apiKey !== env.RESOURCE_SEARCH_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - this endpoint is for internal use only' },
      { status: 401 }
    );
  }

  // 2. Input Parsing & Validation
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const queryMode = url.searchParams.get('queryMode');
  const refinementMode = url.searchParams.get('refinementMode');

  const parseResult = searchSchema.safeParse({
    q,
    queryMode: queryMode ?? undefined,
    refinementMode: refinementMode ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: z.treeifyError(parseResult.error) },
      { status: 400 }
    );
  }

  const { q: query, queryMode: parsedQueryMode, refinementMode: parsedRefinementMode } = parseResult.data;

  try {
    // 3. Execution
    const result = await searchResourcesCombined(query, {
      queryMode: parsedQueryMode as QueryMode,
      refinementMode: parsedRefinementMode as RefinementMode,
    });

    // 4. Response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Resource search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
};

