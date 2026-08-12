/**
 * Failure payload produced by registerResource in `@/lib/resources`:
 * a tagged error with per-stage detail lists.
 */
export interface RegistrationError {
  type: string;
  parseErrors?: string[];
  upsertErrors?: string[];
}

/**
 * Extracts a human-readable error message from a registration error object.
 * Handles parseResponse, validation, and database error shapes.
 */
export function getRegistrationErrorMessage(error: RegistrationError): string {
  const details = error.parseErrors ?? error.upsertErrors ?? [];
  return details.length > 0
    ? `${error.type}: ${details.join(', ')}`
    : error.type;
}
