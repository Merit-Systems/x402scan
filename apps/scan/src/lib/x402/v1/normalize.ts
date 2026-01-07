export const normalizeX402FieldsV1 = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const data = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'accepts' && Array.isArray(value)) {
      result[key] = value.map(accept => normalizeAcceptEntry(accept));
    } else {
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = value;
    }
  }

  return result;
};

const normalizeAcceptEntry = (accept: unknown): unknown => {
  if (!accept || typeof accept !== 'object' || Array.isArray(accept)) {
    return accept;
  }

  const data = accept as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'outputSchema' || key === 'output_schema') {
      result.outputSchema = normalizeOutputSchema(value);
    } else {
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = value;
    }
  }

  return result;
};

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

const normalizeInputSchema = (input: unknown): unknown => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const data = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'query_params') {
      result.queryParams = value;
    } else if (key === 'body_fields') {
      result.bodyFields = value;
    } else if (key === 'body_type') {
      result.bodyType = value;
    } else if (key === 'header_fields') {
      result.headerFields = value;
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

const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};
