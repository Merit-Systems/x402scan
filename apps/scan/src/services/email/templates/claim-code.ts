interface ClaimCodeEmailParams {
  code: string;
  magicLink: string;
  originHostname: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Escape values interpolated into the email HTML (defense-in-depth). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders the origin-claim verification email. Shows the one-time code (primary)
 * and a "Verify ownership" button (the magic link). The link lands on a confirm
 * page rather than auto-consuming the code, so email security scanners that
 * pre-fetch links can't burn it before the human clicks.
 */
export function renderClaimCodeEmail({
  code,
  magicLink,
  originHostname,
}: ClaimCodeEmailParams): RenderedEmail {
  const safeHostname = escapeHtml(originHostname);
  const subject = `Your code to claim ${originHostname}: ${code}`;

  const text = [
    `Verify that you control ${originHostname}.`,
    '',
    `Your one-time code is: ${code}`,
    '',
    `Or confirm by opening this link: ${magicLink}`,
    '',
    'This code expires in 10 minutes. If you did not request it, you can ignore this email.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e5e5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:12px;">
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fafafa;">Claim ${safeHostname}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#a3a3a3;">
            Use the code below to verify that you control this origin's contact email.
          </p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#0a0a0a;border:1px solid #262626;border-radius:8px;color:#fafafa;">
            ${code}
          </div>
          <p style="margin:24px 0 12px;font-size:14px;color:#a3a3a3;text-align:center;">or</p>
          <a href="${magicLink}" style="display:block;text-align:center;padding:12px 16px;background:#fafafa;color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            Verify ownership
          </a>
          <p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#737373;">
            This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
