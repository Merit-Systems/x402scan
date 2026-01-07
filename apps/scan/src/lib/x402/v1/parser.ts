import { normalizeX402FieldsV1 } from './normalize';
import type { X402ResponseV1 } from './schema';
import { x402ResponseSchemaV1 } from './schema';

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function parseV1(data: unknown): ParseResult<X402ResponseV1> {
  const normalized = normalizeX402FieldsV1(data);
  const result = x402ResponseSchemaV1.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => issue.message),
    };
  }
  return { success: true, data: result.data };
}
