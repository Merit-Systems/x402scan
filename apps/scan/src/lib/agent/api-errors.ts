/**
 * Structured JSON error envelope for the public API. Mirrors
 * `components.schemas.Error` in `/openapi.json` and the table in `/docs`.
 */
type ApiErrorType =
  | 'validation_error'
  | 'invalid_address'
  | 'not_found'
  | 'no_discovery'
  | 'method_not_allowed'
  | 'not_in_spec'
  | 'no_valid_resources'
  | 'registration_failed'
  | 'rate_limited'
  | 'internal_error';

export interface ApiErrorBody {
  success: false;
  error: {
    type: ApiErrorType;
    message: string;
    /** What the caller can do to resolve the problem. */
    hint?: string;
    /** Related documentation / discovery URLs. */
    links?: Record<string, string>;
  };
}

export function apiError(
  status: number,
  error: ApiErrorBody['error'],
  headers?: Record<string, string>
): Response {
  const body: ApiErrorBody = { success: false, error };
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}
