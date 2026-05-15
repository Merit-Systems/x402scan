import { NextResponse, type NextRequest } from 'next/server';
import z from 'zod';

import {
  registerResourceUrl,
  registerResourceUrlRequestSchema,
} from '@/lib/resource-registration-api';

function errorStatus(errorType: string) {
  switch (errorType) {
    case 'invalidRequest':
      return 400;
    case 'no402':
    case 'parseErrors':
      return 422;
    default:
      return 500;
  }
}

export const POST = async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          type: 'invalidRequest' as const,
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    );
  }

  const parsed = registerResourceUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          type: 'invalidRequest' as const,
          issues: z.treeifyError(parsed.error),
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await registerResourceUrl(parsed.data);
    return NextResponse.json(result, {
      status: result.success ? 200 : errorStatus(result.error.type),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          type: 'serverError' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
};

