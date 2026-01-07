import type { ParseResult } from '../shared';

import type { X402ResponseV2 } from './schema';
import { x402ResponseSchemaV2 } from './schema';

export function parseV2(data: unknown): ParseResult<X402ResponseV2> {
  const result = x402ResponseSchemaV2.safeParse(data);
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
