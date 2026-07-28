/**
 * Best-effort client IP from proxy headers. On Vercel the first entry of
 * `x-forwarded-for` is the client. Spoofable, so only used as one of several
 * rate-limit dimensions, never as an identity.
 */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get('x-real-ip')?.trim() ?? null;
}
