/**
 * Detects whether a URL contains OpenAPI-style path parameters.
 * Checks for both raw `{param}` and URL-encoded `%7Bparam%7D` forms
 * since discovery may produce either depending on how the URL is resolved.
 */
export function hasPathParameters(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return /{[^}]+}/.test(pathname) || /%7B[^%]+%7D/i.test(pathname);
  } catch {
    return /{[^}]+}/.test(url) || /%7B[^%]+%7D/i.test(url);
  }
}
