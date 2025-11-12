/**
 * Ensures a value is a JSON object for ClickHouse JSON columns
 * ClickHouse JSON columns expect a JSON object (not arrays, strings, or primitives)
 * Wraps non-object values in an object to preserve data
 */
export function ensureJsonObject(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already an object (not array), return it
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  
  // If it's not an object (could be array, string, number, etc.), wrap it
  return { _value: value };
}

