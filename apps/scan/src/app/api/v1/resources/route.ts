import { type NextRequest, NextResponse } from 'next/server';
import { appRouter } from '../../../../server/api/root'; // Adjust path based on actual tRPC root
import { createContext } from '../../../../server/api/trpc'; // Adjust path based on actual tRPC context
import { getHTTPStatusCodeFromError } from '@trpc/server/http';

/**
 * Handles POST requests to register or refresh a resource programmatically.
 * This endpoint exposes the internal tRPC `resource.register` procedure.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body, assuming it contains resource data
    const input = (await req.json()) as {
      name: string;
      description: string;
      url: string;
      category: string;
      providerId?: string; // Optional: for identifying the provider or existing resource
      tags?: string[];
      metadata?: Record<string, unknown>;
      // Add other fields that your resource.register tRPC procedure expects
    };

    // Create a tRPC context, mimicking the environment of an internal tRPC call.
    // The createContext function should be able to handle NextRequest.
    const ctx = await createContext({ req, resHeaders: new Headers() });

    // Create a tRPC caller instance from the appRouter
    const caller = appRouter.createCaller(ctx);

    // Call the internal tRPC procedure for resource registration/update.
    // Assuming there's a 'resource' router with a 'register' mutation.
    const result = await caller.resource.register(input);

    return NextResponse.json({ status: 'success', data: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error registering resource programmatically:', error);

    // Determine the appropriate HTTP status code from the tRPC error
    const httpStatusCode = getHTTPStatusCodeFromError(error);

    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'An unexpected error occurred during resource registration.',
        code: error.code || 'INTERNAL_SERVER_ERROR',
      },
      { status: httpStatusCode },
    );
  }
}
