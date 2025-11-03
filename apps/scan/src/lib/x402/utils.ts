/**
 * Normalize only x402 protocol fields, preserve API schema field names
 */
export const normalizeX402Fields = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const data = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'accepts' && Array.isArray(value)) {
      // Process accepts array but preserve outputSchema contents
      result[key] = value.map(accept => normalizeAcceptEntry(accept));
    } else {
      // Convert x402 protocol fields
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = value;
    }
  }

  return result;
};

/**
 * Normalize accept entry while preserving outputSchema field names
 */
const normalizeAcceptEntry = (accept: unknown): unknown => {
  if (!accept || typeof accept !== 'object' || Array.isArray(accept)) {
    return accept;
  }

  const data = accept as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'outputSchema' || key === 'output_schema') {
      // Normalize outputSchema structure but preserve API field names
      result.outputSchema = normalizeOutputSchema(value);
    } else {
      // Convert x402 protocol fields
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = value;
    }
  }

  return result;
};

/**
 * Normalize outputSchema structure (input/output keys and HTTP schema fields)
 * but preserve the actual API field names within queryParams/bodyFields/headerFields
 */
const normalizeOutputSchema = (outputSchema: unknown): unknown => {
  if (
    !outputSchema ||
    typeof outputSchema !== 'object' ||
    Array.isArray(outputSchema)
  ) {
    return outputSchema;
  }

  const data = outputSchema as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'input') {
      result.input = normalizeInputSchema(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Normalize input schema structure (convert query_params -> queryParams, etc.)
 * but preserve field names within the param/field records
 */
const normalizeInputSchema = (input: unknown): unknown => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const data = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Convert HTTP schema structure field names
    if (key === 'query_params') {
      result.queryParams = value; // Preserve field names within
    } else if (key === 'body_fields') {
      result.bodyFields = value; // Preserve field names within
    } else if (key === 'body_type') {
      result.bodyType = value;
    } else if (key === 'header_fields') {
      result.headerFields = value; // Preserve field names within
    } else if (key === 'body' && !result.bodyFields) {
      result.bodyFields = value;
    } else if (key === 'query' && !result.queryParams) {
      result.queryParams = value;
    } else if (key === 'headers' && !result.headerFields) {
      result.headerFields = value;
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Converts a single snake_case string to camelCase
 */
const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};
