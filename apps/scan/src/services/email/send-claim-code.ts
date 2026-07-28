import { env } from '@/env';

import { CLAIM_EMAIL_TIMEOUT_MS } from '@/services/claim/constants';

import { getResendClient } from './client';
import { renderClaimCodeEmail } from './templates/claim-code';

interface SendClaimCodeParams {
  to: string;
  code: string;
  magicLink: string;
  originHostname: string;
}

/**
 * Sends the origin-claim verification email. When RESEND_API_KEY is absent in a
 * non-production environment, the code + link are logged to the server console
 * instead so the flow stays testable locally without an email provider. Returns
 * whether the code reached a transport; never throws.
 */
export async function sendClaimCode({
  to,
  code,
  magicLink,
  originHostname,
}: SendClaimCodeParams): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    if (env.NEXT_PUBLIC_NODE_ENV !== 'production') {
      console.log('[claim:email] dev transport (no RESEND_API_KEY)', {
        to,
        originHostname,
        code,
        magicLink,
      });
      return true;
    }
    console.error('[claim:email] RESEND_API_KEY missing in production');
    return false;
  }

  const { subject, html, text } = renderClaimCodeEmail({
    code,
    magicLink,
    originHostname,
  });

  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { error } = await Promise.race([
      resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('resend timeout')),
          CLAIM_EMAIL_TIMEOUT_MS
        );
      }),
    ]).finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    if (error) {
      console.error('[claim:email] resend send failed', {
        originHostname,
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error('[claim:email] resend threw', {
      originHostname,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
