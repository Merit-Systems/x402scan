import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import superjson from 'superjson';

import { registerResource } from '@/services/resources/registration';

const inputSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.object().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await request.json();
    const parseResult = inputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: true,
          type: 'validation',
          message: 'Invalid input',
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Use shared registration service
    const result = await registerResource(parseResult.data);

    // Handle error cases
    if (result.error) {
      if (result.type === 'parseErrors') {
        return NextResponse.json(
          {
            error: true,
            type: 'parseErrors',
            parseErrorData: result.parseErrorData,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          type: 'no402',
          message: 'The resource did not respond with a 402 status code',
        },
        { status: 400 }
      );
    }

    // Serialize with superjson to handle BigInt and Date types
    const serialized = superjson.stringify(result);

    return new NextResponse(serialized, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error registering resource:', error);
    return NextResponse.json(
      {
        error: true,
        type: 'server',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
