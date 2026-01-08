import type { ParseResult } from '../shared';

import type { X402ResponseV1 } from './schema';
import { x402ResponseSchemaV1 } from './schema';

export function parseV1(data: unknown): ParseResult<X402ResponseV1> {
  const result = x402ResponseSchemaV1.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`
      ),
    };
  }
  return { success: true, data: result.data };
}
