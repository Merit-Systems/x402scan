'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import type { ServerHostMismatch } from '@/lib/discovery/server-host-mismatch';
import type { BlockedFavicon } from '@/lib/discovery/favicon-blocked';

const SETUP_PROMPT = `My API doesn't have a discovery document yet. Create an OpenAPI spec (openapi.json) that describes my endpoints, then serve it so x402scan.com can discover them.

Read https://x402scan.com/discovery/spec for the full discovery specification.

Steps:
1. Identify all endpoints in my API — both paid (x402) and free (identity-gated)
2. Create an openapi.json with paths, methods, request/response schemas, and descriptions
3. Serve it at /openapi.json (or /.well-known/x402 pointing to it)
4. Paid endpoints must return a 402 with valid x402 v2 payment headers when called without payment
5. Free endpoints should declare \`"security": []\` in the OpenAPI spec

Do everything automatically. Only ask me if you need input you can't determine yourself.`;

/**
 * Endpoints all failed because the spec is served from one host and declares
 * its API on another, so x402scan probed the wrong host.
 */
function hostMismatchSection({
  documentOrigin,
  declaredOrigin,
}: ServerHostMismatch): string {
  return `Endpoints were probed at the wrong host (this explains the failures below):

My openapi.json is served from ${documentOrigin}, but it declares its API on a different host:
  "servers": [{ "url": "${declaredOrigin}" }]
x402scan resolves endpoints against the host serving the document, so it probed ${documentOrigin}/... instead of ${declaredOrigin}/... and got 404s. The endpoints themselves are fine — do not change the paywall, the request validation, or the schemas.
Pick one:
1. Register ${declaredOrigin} with x402scan instead of ${documentOrigin} — serve openapi.json at ${declaredOrigin}/openapi.json if it isn't there already. Prefer this.
2. Serve the API and the spec from the same host, so "servers" matches the origin the document is published on.`;
}

function buildConsolidatedPrompt({
  failedResources,
  warnings,
  missingSchemaResources,
  missingContactEmail,
  serverHostMismatch,
  blockedFavicon,
}: {
  failedResources?: { url: string; error: string; status?: number }[];
  warnings?: { url: string; error: string; status?: number }[];
  missingSchemaResources?: string[];
  missingContactEmail?: boolean;
  serverHostMismatch?: ServerHostMismatch | null;
  blockedFavicon?: BlockedFavicon | null;
}): string {
  const sections: string[] = [];

  if (serverHostMismatch) {
    sections.push(hostMismatchSection(serverHostMismatch));
  }

  if (blockedFavicon) {
    sections.push(`Favicon blocked by Cross-Origin-Resource-Policy:

${blockedFavicon.url} is served with "Cross-Origin-Resource-Policy: ${blockedFavicon.policy}". The file itself is fine — browsers just refuse to render it on any other site, so x402scan shows a placeholder instead of your icon.
Send "Cross-Origin-Resource-Policy: cross-origin" for your public static assets. If you use Helmet, its default is same-origin, so override it for the favicon route rather than disabling it for the whole app.`);
  }

  if (missingContactEmail) {
    sections.push(`Missing contact email:

Your openapi.json is missing info.contact.email. Add a "contact" object with your email to the top-level "info" field:
{ "info": { "contact": { "email": "you@example.com" } } }
Adding your email lets you verify ownership, allows users to contact you, and lets you customize your merchant pages on tryponcho.com.`);
  }

  // Listing every 404 under a host mismatch just invites the agent to go
  // hunting for a paywall bug that isn't there.
  if (!serverHostMismatch && failedResources && failedResources.length > 0) {
    const lines = failedResources.map(r => {
      const status = r.status ? ` (HTTP ${r.status})` : '';
      return `- ${r.url}: ${r.error}${status}`;
    });
    sections.push(`Errors (these endpoints failed and won't be registered):

${lines.join('\n')}`);
  }

  if (warnings && warnings.length > 0) {
    const lines = warnings.map(r => {
      const status = r.status ? ` (HTTP ${r.status})` : '';
      return `- ${r.url}: ${r.error}${status}`;
    });
    sections.push(`Warnings (registered but with issues):

${lines.join('\n')}`);
  }

  if (missingSchemaResources && missingSchemaResources.length > 0) {
    const lines = missingSchemaResources.map(u => `- ${u}`);
    sections.push(`Missing input schemas (agents won't know what request to send):

${lines.join('\n')}`);
  }

  // Shouldn't be reachable (prompt only shown when there are issues), but
  // fall back to the spec link rather than a misleading generic message.
  if (sections.length === 0) {
    return 'Read https://x402scan.com/discovery/spec for the full discovery specification. Follow the guide to ensure your endpoints are correctly configured for x402scan.';
  }

  const issueBlock = sections.join('\n\n');

  // The endpoint checklist only applies to probe failures we can't already
  // account for. Appending it to a host-mismatch or favicon-only prompt would
  // point the agent at code that is working correctly.
  const hasUnexplainedEndpointIssues =
    (!serverHostMismatch && (failedResources?.length ?? 0) > 0) ||
    (warnings?.length ?? 0) > 0 ||
    (missingSchemaResources?.length ?? 0) > 0;

  const checklist = hasUnexplainedEndpointIssues
    ? `
To fix the endpoint failures:
1. Paid endpoints must return a 402 status with valid x402 v2 payment headers when called without payment
2. Request validation (body schema, query params) must not reject the request before the x402 middleware runs
3. Mark all required query parameters with "required": true in the OpenAPI spec — x402scan probes endpoints automatically
4. Add request/response schemas to the OpenAPI spec so agents know what to send and expect back
5. Free (identity-gated) endpoints should declare \`"security": []\` in the OpenAPI spec
`
    : '';

  return `${issueBlock}

Read https://x402scan.com/discovery/spec for the full discovery specification.
${checklist}
Fix each issue. Only ask me if you need input you can't determine yourself.`;
}

export function DiscoveryActions({
  iconOnly,
  label,
  failedResources,
  warnings,
  noDiscovery,
  missingSchemaResources,
  missingContactEmail,
  serverHostMismatch,
  blockedFavicon,
  customPrompt,
}: {
  iconOnly?: boolean;
  label?: string;
  failedResources?: { url: string; error: string; status?: number }[];
  warnings?: { url: string; error: string; status?: number }[];
  noDiscovery?: boolean;
  /** URLs missing input schemas — merged into the consolidated prompt. */
  missingSchemaResources?: string[];
  /** Whether the origin is missing info.contact.email. */
  missingContactEmail?: boolean;
  /** Set when the spec declares its API on a host other than its own. */
  serverHostMismatch?: ServerHostMismatch | null;
  /** Set when the resolved favicon is blocked cross-origin by CORP. */
  blockedFavicon?: BlockedFavicon | null;
  /** Override the generated prompt with a custom one. */
  customPrompt?: string;
}) {
  const prompt =
    customPrompt ??
    (noDiscovery
      ? SETUP_PROMPT
      : buildConsolidatedPrompt({
          failedResources,
          warnings,
          missingSchemaResources,
          missingContactEmail,
          serverHostMismatch,
          blockedFavicon,
        }));

  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  if (label) {
    return (
      <button
        onClick={() => void copyToClipboard(prompt)}
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        {label}
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    );
  }

  if (iconOnly) {
    return (
      <button
        onClick={() => void copyToClipboard(prompt)}
        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors whitespace-nowrap"
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy Prompt'}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-fit gap-1.5"
      onClick={() => void copyToClipboard(prompt)}
    >
      {isCopied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {isCopied ? 'Copied' : 'Let your agent handle it'}
    </Button>
  );
}
