'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const SETUP_PROMPT = `My API doesn't have a discovery document yet. Create an OpenAPI spec (openapi.json) that describes my endpoints, then serve it so x402scan.com can discover them.

Read https://x402scan.com/discovery/spec for the full discovery specification.

Steps:
1. Identify all endpoints in my API — both paid (x402) and free (identity-gated)
2. Create an openapi.json with paths, methods, request/response schemas, and descriptions
3. Serve it at /openapi.json (or /.well-known/x402 pointing to it)
4. Paid endpoints must return a 402 with valid x402 v2 payment headers when called without payment
5. Free endpoints should declare \`"security": []\` in the OpenAPI spec

Do everything automatically. Only ask me if you need input you can't determine yourself.`;

function buildConsolidatedPrompt({
  failedResources,
  warnings,
  missingSchemaResources,
  missingContactEmail,
}: {
  failedResources?: { url: string; error: string; status?: number }[];
  warnings?: { url: string; error: string; status?: number }[];
  missingSchemaResources?: string[];
  missingContactEmail?: boolean;
}): string {
  const sections: string[] = [];

  if (missingContactEmail) {
    sections.push(`Missing contact email:

Your openapi.json is missing info.contact.email. Add a "contact" object with your email to the top-level "info" field:
{ "info": { "contact": { "email": "you@example.com" } } }
This gives you two pages on tryponcho.com: /m/your-origin (a storefront for users to try your API) and /p/your-origin (a dashboard with usage analytics and endpoint health).`);
  }

  if (failedResources && failedResources.length > 0) {
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

  return `${issueBlock}

Read https://x402scan.com/discovery/spec for the full discovery specification.

To fix these:
1. Paid endpoints must return a 402 status with valid x402 v2 payment headers when called without payment
2. Request validation (body schema, query params) must not reject the request before the x402 middleware runs
3. Mark all required query parameters with "required": true in the OpenAPI spec — x402scan probes endpoints automatically
4. Add request/response schemas to the OpenAPI spec so agents know what to send and expect back
5. Free (identity-gated) endpoints should declare \`"security": []\` in the OpenAPI spec

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
