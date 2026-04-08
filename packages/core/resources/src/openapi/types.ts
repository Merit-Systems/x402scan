/**
 * Defines the internal structure for a parsed OpenAPI Operation.
 * This is a simplified representation to focus on relevant fields for resource querying.
 */
export interface ParsedOpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    schema: any; // Simplified schema definition (e.g., JSDoc for OpenAPI Schema Object)
    example?: any;
    examples?: { [key: string]: { value: any; summary?: string; description?: string } };
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content: {
      [mediaType: string]: {
        schema: any; // Simplified schema definition
        example?: any;
        examples?: { [key: string]: { value: any; summary?: string; description?: string } };
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        [mediaType: string]: {
          schema: any; // Simplified schema definition
          example?: any;
          examples?: { [key: string]: { value: any; summary?: string; description?: string } };
        };
      };
    };
  };
}

/**
 * Defines the internal structure for a parsed OpenAPI Path Item (e.g., /users/{id}).
 */
export interface ParsedOpenAPIPathItem {
  [method: string]: ParsedOpenAPIOperation; // e.g., 'get', 'post', 'put', 'delete'
}

/**
 * Defines the internal structure for a parsed OpenAPI Specification,
 * extracting key information needed for defining and querying resources.
 */
export interface ParsedOpenAPISchema {
  version: string; // e.g., '3.0.0' or '3.1.0'
  title?: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
  paths: {
    [path: string]: ParsedOpenAPIPathItem;
  };
  components?: {
    schemas?: {
      [name: string]: any; // Reusable schema definitions
    };
    securitySchemes?: {
      [name: string]: any; // Authentication mechanisms
    };
    parameters?: {
      [name: string]: any; // Reusable parameter definitions
    };
    requestBodies?: {
      [name: string]: any; // Reusable request body definitions
    };
    responses?: {
      [name: string]: any; // Reusable response definitions
    };
    // ... other components as needed
  };
  security?: Array<{ [key: string]: string[] }>; // Global security requirements
  tags?: Array<{ name: string; description?: string }>; // Tags used for operations
  externalDocs?: { url: string; description?: string }; // External documentation
}

/**
 * Represents the result of parsing an OpenAPI spec string.
 */
export type ParsedOpenAPIResult = {
  success: true;
  schema: ParsedOpenAPISchema;
} | {
  success: false;
  errors: string[];
};
