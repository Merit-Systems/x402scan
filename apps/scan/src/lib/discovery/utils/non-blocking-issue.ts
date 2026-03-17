import type { X402ValidationIssue } from '@/types/validation';

/**
 * Whether a validation issue should be treated as non-blocking for ingestion.
 *
 * - SCHEMA_OUTPUT_MISSING: surfaced as a warning in UI but does not block registration.
 * - COINBASE_SCHEMA_INVALID (nullable string): Coinbase validator rejects nullable strings
 *   in some producer payloads we still want to ingest.
 */
export function isNonBlockingIssue(issue: X402ValidationIssue): boolean {
  if (issue.code === 'SCHEMA_OUTPUT_MISSING') return true;
  if (
    issue.code === 'COINBASE_SCHEMA_INVALID' &&
    issue.message.includes('Expected string, received null')
  )
    return true;
  return false;
}
