'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

// Duplicated from discovery/_constants/prompts.ts to avoid cross-directory
// import issues with Turbopack in dev. Keep in sync.
const GENERIC_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

function buildErrorPrompt(
  resources: { url: string; error: string }[],
  missingSchemaUrls?: string[]
): string {
  const lines = resources.map(r => `- ${r.url}: ${r.error}`);

  let schemaSection = '';
  if (missingSchemaUrls && missingSchemaUrls.length > 0) {
    const schemaLines = missingSchemaUrls.map(u => `- ${u}`);
    schemaSection = `

These endpoints are also missing input schemas (agents won't know what request to send):

${schemaLines.join('\n')}

For each, add a requestBody schema and/or parameter definitions to the OpenAPI spec.`;
  }

  return `These x402 endpoints failed registration on x402scan.com:

${lines.join('\n')}${schemaSection}

Read https://x402scan.com/discovery/spec for the full discovery specification.

For each failing endpoint:
1. Verify the endpoint returns a 402 status with valid x402 payment headers when called without payment
2. Check that request validation (body schema, query params) doesn't reject the request before the x402 middleware runs
3. In the OpenAPI spec, mark all required query parameters with "required": true — x402scan probes endpoints automatically and needs to know which parameters are required to test successfully
4. Ensure the endpoint is listed in your OpenAPI spec with the correct method and input schema

Fix each issue. Only ask me if you need input you can't determine yourself.`;
}

function buildWarningPrompt(
  resources: { url: string; error: string }[]
): string {
  const lines = resources.map(r => `- ${r.url}: ${r.error}`);
  return `These endpoints were found in my API spec but triggered warnings during registration on x402scan.com:

${lines.join('\n')}

If these endpoints are meant to be paid, read https://x402scan.com/discovery/spec and ensure each one returns a 402 status with valid x402 payment headers when called without payment.

If they're intentionally free, remove them from the x402 discovery document so they don't show as warnings.

Only ask me if you need input you can't determine yourself.`;
}

const V1_MIGRATION_PROMPT = `My x402 endpoints are returning v1 payment responses. Migrate them to the x402 v2 spec.

Key changes from v1 to v2:
- The 402 response body must include \`"x402Version": 2\`
- The \`accepts\` array replaces \`maxAmountRequired\` with \`amount\` (the exact price for this request)
- Each entry in \`accepts\` must include: scheme, network, asset, amount, payTo
- Remove \`maxTimeoutSeconds\` from accepts entries (moved to top-level \`x402Version\` sibling if needed)

Read https://x402scan.com/discovery/spec for the full v2 specification.

Update every endpoint that returns a v1 response. Only ask me if you need input you can't determine yourself.`;

const CREATE_OPENAPI_PROMPT = `My API doesn't have a discovery document yet. Create an OpenAPI spec (openapi.json) that describes my x402-paid endpoints, then serve it so x402scan.com can discover them.

Read https://x402scan.com/discovery/spec for the full discovery specification.

Steps:
1. Identify all paid endpoints in my API
2. Create an openapi.json with paths, methods, request/response schemas, and descriptions
3. Serve it at /openapi.json (or /.well-known/x402 pointing to it)
4. Ensure each paid endpoint returns a 402 with valid x402 v2 payment headers when called without payment

Do everything automatically. Only ask me if you need input you can't determine yourself.`;

const ADD_SCHEMA_PROMPT = `Some of my x402 endpoints are missing input/output schemas in the OpenAPI spec. Without these, agents can find and pay for the endpoint but don't know what request to send.

Read https://x402scan.com/discovery/spec for the full discovery specification.

For each endpoint in my OpenAPI spec:
1. Add a requestBody schema describing the expected JSON body (field names, types, descriptions, required fields)
2. Add response schemas describing what the endpoint returns
3. Add parameter definitions for any required query parameters

Do everything automatically. Only ask me if you need input you can't determine yourself.`;

export function DiscoveryActions({
  iconOnly,
  label,
  failedResources,
  warnings,
  v1Migration,
  noDiscovery,
  missingSchema,
  missingSchemaResources,
}: {
  iconOnly?: boolean;
  label?: string;
  failedResources?: { url: string; error: string }[];
  warnings?: { url: string; error: string }[];
  v1Migration?: boolean;
  noDiscovery?: boolean;
  missingSchema?: boolean;
  /** URLs missing input schemas — merged into the error prompt when both exist. */
  missingSchemaResources?: string[];
}) {
  const prompt = noDiscovery
    ? CREATE_OPENAPI_PROMPT
    : v1Migration
      ? V1_MIGRATION_PROMPT
      : failedResources && failedResources.length > 0
        ? buildErrorPrompt(failedResources, missingSchemaResources)
        : missingSchema
          ? ADD_SCHEMA_PROMPT
          : warnings && warnings.length > 0
            ? buildWarningPrompt(warnings)
            : GENERIC_PROMPT;

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
