export type ErrorType =
  | 'invalid_request' // 400 Bad Request
  | 'unauthorized' // 401 Unauthorized
  | 'payment_required' // 402 Payment Required
  | 'forbidden' // 403 Forbidden
  | 'not_found' // 404 Not Found
  | 'conflict' // 409 Conflict
  | 'rate_limit' // 429 Too Many Requests
  | 'internal' // 500 Internal Server Error
  | 'bad_gateway' // 502 Bad Gateway
  | 'service_unavailable' // 503 Service Unavailable
  | 'offline'; // Custom/Network offline

export const errorTypeToStatusCode = {
  invalid_request: 400,
  unauthorized: 401,
  payment_required: 402,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limit: 429,
  internal: 500,
  bad_gateway: 502,
  service_unavailable: 503,
  offline: 503,
} as const satisfies Record<ErrorType, number>;
