import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { parseOpenAPISpec, constructResourceUrl } from '@/services/openapi-parser';

const inputSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  spec: z.union([
    z.string().min(1, 'Spec cannot be empty'),
    z.object({}).passthrough(),
  ]),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
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

    const { baseUrl, spec, dryRun } = parseResult.data;

    // Parse the OpenAPI spec
    let parsedSpec;
    try {
      parsedSpec = await parseOpenAPISpec(spec);
    } catch (error) {
      return NextResponse.json(
        {
          error: true,
          type: 'parsing',
          message: error instanceof Error ? error.message : 'Failed to parse OpenAPI spec',
        },
        { status: 400 }
      );
    }

    // Build resource URLs from endpoints
    const resources = parsedSpec.endpoints.map(endpoint => ({
      url: constructResourceUrl(baseUrl, endpoint.path),
      method: endpoint.method,
      operationId: endpoint.operationId,
      summary: endpoint.summary,
      description: endpoint.description,
    }));

    // If dry run, just return what would be registered
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        info: parsedSpec.info,
        totalEndpoints: resources.length,
        resources,
      });
    }

    // Register each resource using the existing endpoint
    const registrationResults = [];
    
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      
      // Add delay between requests to avoid overwhelming Neon database
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      try {
        const response = await fetch(
          new URL('/api/v1/resources/register', request.nextUrl.origin),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: resource.url,
            }),
          }
        );

        const result = await response.json();
        
        registrationResults.push({
          url: resource.url,
          method: resource.method,
          operationId: resource.operationId,
          summary: resource.summary,
          success: !result.error,
          result,
        });
      } catch (error) {
        registrationResults.push({
          url: resource.url,
          method: resource.method,
          operationId: resource.operationId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = registrationResults.filter(r => r.success).length;
    const failedCount = registrationResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      info: parsedSpec.info,
      totalEndpoints: resources.length,
      registered: successCount,
      failed: failedCount,
      results: registrationResults,
    });
  } catch (error) {
    console.error('Error processing OpenAPI spec:', error);
    return NextResponse.json(
      {
        error: true,
        type: 'server',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}