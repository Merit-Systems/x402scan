import { Resend } from 'resend';

import { env } from '@/env';

/**
 * Lazily-constructed Resend client singleton. Returns null when RESEND_API_KEY
 * is unset so callers can fall back to a dev-console transport.
 */
let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}
