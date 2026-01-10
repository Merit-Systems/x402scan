/**
 * Utility functions for building HTTP requests with query parameters and body handling
 */

type BodyType =
  | 'json'
  | 'form-data'
  | 'multipart-form-data'
  | 'text'
  | 'binary';

interface BuildRequestOptions {
  url: string | URL;
  method: string;
  bodyType?: BodyType;
  body?: Record<string, unknown> | BodyInit;
  query?: Record<string, unknown>;
  existingHeaders?: HeadersInit;
}

interface BuildRequestResult {
  url: string;
  requestInit: RequestInit;
}

/**
 * Appends query parameters to a URL, handling different value types
 */
function appendQueryParams(url: URL, query: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        url.searchParams.append(key, JSON.stringify(value));
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        url.searchParams.append(key, String(value));
      } else {
        // String or other primitives (symbol, bigint, function, etc.)
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        url.searchParams.append(key, String(value));
      }
    }
  }
}

/**
 * Constructs request body and headers based on bodyType
 */
function buildRequestBody(
  bodyType: BodyType,
  body: Record<string, unknown> | BodyInit
): { body: BodyInit; headers?: HeadersInit } {
  // If body is already BodyInit (for binary case), handle it specially
  if (
    bodyType === 'binary' &&
    (body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      typeof body === 'string')
  ) {
    return {
      body: body as BodyInit,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    };
  }

  console.log(typeof body);

  // For other types, body should be Record<string, unknown>
  // Check if body is a plain object (not Blob, ArrayBuffer, etc.)
  if (
    bodyType !== 'binary' &&
    !(
      typeof body === 'object' &&
      body !== null &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams)
    )
  ) {
    throw new Error(
      `Invalid body type for bodyType ${bodyType}. Expected Record<string, unknown>`
    );
  }

  const bodyRecord = body as Record<string, unknown>;
  switch (bodyType) {
    case 'json':
      return {
        body: JSON.stringify(bodyRecord),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    case 'form-data':
      // Form data (application/x-www-form-urlencoded)
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(bodyRecord)) {
        if (value !== undefined && value !== null) {
          let stringValue: string;
          if (typeof value === 'object' && !(value instanceof Blob)) {
            stringValue = JSON.stringify(value);
          } else if (typeof value === 'string') {
            stringValue = value;
          } else {
            // Number, boolean, or other primitives
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            stringValue = String(value);
          }
          formData.append(key, stringValue);
        }
      }
      return {
        body: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
    case 'multipart-form-data':
      // Multipart form data
      const multipartFormData = new FormData();
      for (const [key, value] of Object.entries(bodyRecord)) {
        if (value !== undefined && value !== null) {
          if (value instanceof Blob || value instanceof File) {
            multipartFormData.append(key, value);
          } else if (typeof value === 'object' && value !== null) {
            multipartFormData.append(key, JSON.stringify(value));
          } else if (typeof value === 'string') {
            multipartFormData.append(key, value);
          } else {
            // Number, boolean, or other primitives
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            multipartFormData.append(key, String(value));
          }
        }
      }
      return {
        body: multipartFormData,
        // Don't set Content-Type header for FormData, browser will set it with boundary
      };
    case 'text':
      // For text, body should be a string, but we'll handle it
      const textBody =
        typeof bodyRecord === 'string'
          ? bodyRecord
          : JSON.stringify(bodyRecord);
      return {
        body: textBody,
        headers: {
          'Content-Type': 'text/plain',
        },
      };
    default:
      // Default to JSON if bodyType is not recognized
      return {
        body: JSON.stringify(bodyRecord),
        headers: {
          'Content-Type': 'application/json',
        },
      };
  }
}

/**
 * Builds a complete request with URL, query parameters, body, and headers
 * based on the HTTP method and bodyType
 */
export function buildRequest(options: BuildRequestOptions): BuildRequestResult {
  const requestUrl = new URL(options.url.toString());
  const requestMethod = options.method.toUpperCase();
  const isBodylessMethod =
    requestMethod === 'GET' ||
    requestMethod === 'HEAD' ||
    requestMethod === 'OPTIONS';

  // Append query parameters to URL
  if (options.query) {
    appendQueryParams(requestUrl, options.query);
  }

  const requestInit: RequestInit = {
    method: requestMethod,
  };

  // Merge existing headers if provided
  if (options.existingHeaders) {
    requestInit.headers = options.existingHeaders;
  }

  // For bodyless methods, query params are already in URL, no body needed
  if (isBodylessMethod) {
    // No body for these methods
  } else if (options.body && options.bodyType) {
    // Handle different body types
    const { body, headers } = buildRequestBody(options.bodyType, options.body);
    requestInit.body = body;
    if (headers) {
      requestInit.headers = {
        ...(requestInit.headers instanceof Headers
          ? Object.fromEntries(requestInit.headers.entries())
          : requestInit.headers),
        ...headers,
      };
    }
  } else if (options.body && !options.bodyType) {
    // Default to JSON if body is provided but no bodyType specified
    requestInit.body = JSON.stringify(options.body);
    requestInit.headers = {
      ...(requestInit.headers instanceof Headers
        ? Object.fromEntries(requestInit.headers.entries())
        : requestInit.headers),
      'Content-Type': 'application/json',
    };
  }

  return {
    url: requestUrl.toString(),
    requestInit,
  };
}
