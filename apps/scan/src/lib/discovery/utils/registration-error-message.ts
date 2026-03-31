import { getValidationIssueMessages } from '@/types/validation';

/**
 * Extracts a human-readable error message from a registration error object.
 * Handles parseResponse, database, and generic error shapes.
 */
export function getRegistrationErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (!err || typeof err !== 'object') return 'Unknown error';
  if ('type' in err && typeof err.type === 'string') {
    const details: string[] = [];
    if ('parseErrors' in err && Array.isArray(err.parseErrors)) {
      details.push(...(err.parseErrors as string[]));
    } else if ('issues' in err && Array.isArray(err.issues)) {
      details.push(...getValidationIssueMessages(err.issues as unknown[]));
    } else if ('upsertErrors' in err && Array.isArray(err.upsertErrors)) {
      details.push(...(err.upsertErrors as string[]));
    }
    return details.length > 0 ? `${err.type}: ${details.join(', ')}` : err.type;
  }
  return 'Unknown error';
}
