import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[];
  requestBody?: OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
  responses?: OpenAPIV3.ResponsesObject | OpenAPIV3_1.ResponsesObject;
}

export interface ParsedOpenAPISpec {
  info: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: string[];
  endpoints: ParsedEndpoint[];
}

export async function parseOpenAPISpec(
  spec: string | object
): Promise<ParsedOpenAPISpec> {
  try {
    // If spec is a string, try to parse it as JSON first
    let specObj: any;
    if (typeof spec === 'string') {
      try {
        specObj = JSON.parse(spec);
      } catch {
        // If not JSON, assume it's YAML and let swagger-parser handle it
        specObj = spec;
      }
    } else {
      specObj = spec;
    }

    // Parse and validate the OpenAPI spec
    const api = (await SwaggerParser.validate(specObj)) as 
      OpenAPIV3.Document | OpenAPIV3_1.Document;
    
    const parsedEndpoints: ParsedEndpoint[] = [];

    if (!api.paths) {
      throw new Error('No paths found in OpenAPI spec');
    }

    // Extract server URLs
    const servers = api.servers?.map(server => server.url) || [];

    // Extract all endpoints
    for (const [path, pathItem] of Object.entries(api.paths)) {
      if (!pathItem) continue;

      const methods: Array<keyof OpenAPIV3.PathItemObject> = [
        'get',
        'post',
        'put',
        'delete',
        'patch',
        'options',
        'head',
        'trace',
      ];

      for (const method of methods) {
        const operation = pathItem[method] as 
          OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject | undefined;
        
        if (!operation) continue;

        parsedEndpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters as any,
          requestBody: operation.requestBody as any,
          responses: operation.responses,
        });
      }
    }

    return {
      info: {
        title: api.info.title,
        version: api.info.version,
        description: api.info.description,
      },
      servers,
      endpoints: parsedEndpoints,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse OpenAPI spec: ${errorMessage}`);
  }
}

// Helper to construct full URL from base URL and path
export function constructResourceUrl(baseUrl: string, path: string): string {
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
}