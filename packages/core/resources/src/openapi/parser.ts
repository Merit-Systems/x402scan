// Assuming 'yaml' and a robust OpenAPI parser like 'swagger-parser' or 'openapi-parser'
// would be installed as dependencies. For this example, we use a basic approach.
import { parse as parseYaml } from 'yaml';
import { ParsedOpenAPISchema, ParsedOpenAPIResult } from './types';

/**
 * Parses an OpenAPI spec string (JSON or YAML) into a structured object.
 * This is a simplified parser for demonstration purposes. In a production environment,
 * a robust OpenAPI parser library (e.g., '@apidevtools/swagger-parser' or 'oas-parser')
 * should be used for full validation, dereferencing, and normalization.
 *
 * @param specString The raw OpenAPI spec content (JSON or YAML).
 * @returns A ParsedOpenAPIResult indicating success/failure and the parsed schema or errors.
 */
export function parseOpenAPISpec(specString: string): ParsedOpenAPIResult {
  try {
    let parsed: any;
    let isYaml = false;

    // Attempt to parse as JSON first
    try {
      parsed = JSON.parse(specString);
    } catch (jsonError: any) {
      // If JSON parsing fails, try YAML
      try {
        parsed = parseYaml(specString);
        isYaml = true;
      } catch (yamlError: any) {
        return {
          success: false,
          errors: [
            'Invalid OpenAPI spec format: Content is neither valid JSON nor YAML.',
            `JSON parsing error: ${jsonError.message}`,
            `YAML parsing error: ${yamlError.message}`,
          ],
        };
      }
    }

    // Basic structural validation for OpenAPI 3.x
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, errors: ['Parsed content is not a valid object.'] };
    }
    if (!parsed.openapi || typeof parsed.openapi !== 'string' || !parsed.openapi.startsWith('3.')) {
      return { success: false, errors: [`Invalid or unsupported OpenAPI version. Expected '3.x.x', got '${parsed.openapi || 'none'}'`] };
    }
    if (!parsed.paths || typeof parsed.paths !== 'object' || Object.keys(parsed.paths).length === 0) {
      return { success: false, errors: ['OpenAPI spec must contain a "paths" object with at least one path.'] };
    }
    if (!parsed.info || typeof parsed.info !== 'object' || !parsed.info.title || !parsed.info.version) {
      return { success: false, errors: ['OpenAPI spec must contain "info" object with "title" and "version".'] };
    }

    // Extract the relevant parts of the schema for internal representation
    const schema: ParsedOpenAPISchema = {
      version: parsed.openapi,
      title: parsed.info.title,
      description: parsed.info.description,
      servers: parsed.servers,
      paths: parsed.paths,
      components: parsed.components,
      security: parsed.security,
      tags: parsed.tags,
      externalDocs: parsed.externalDocs,
    };

    // In a real implementation, you would use a dedicated OpenAPI validator
    // here to ensure the spec is fully compliant and well-formed.
    // E.g., const validationErrors = await SwaggerParser.validate(parsed);
    // If validationErrors.length > 0, return { success: false, errors: validationErrors };

    return { success: true, schema };
  } catch (e: any) {
    // Catch any unexpected errors during the process
    return { success: false, errors: [`An unexpected error occurred during OpenAPI spec parsing: ${e.message}`] };
  }
}
