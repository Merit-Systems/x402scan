'use client';

import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const PAGE_URL = 'https://x402scan.com/discovery/architecture';

const PAGE_MARKDOWN = `# Architecture Patterns

High-level architectures for building agent-payable services with x402.

## Proxy architecture

Restructuring your backend and database to support agentic payments can be a daunting, time-consuming task, and in most cases it isn't strictly necessary to bring your service online. The pattern below lets you add agentic commerce support with minimal changes to your production architecture.

## Overview

Stand up a thin proxy in front of your existing backend. The proxy handles everything x402-specific — payment verification, wallet identity, per-wallet authorization, rate limiting, and discovery — while your production API stays untouched.

\`\`\`
Agent  ──(x402)──▶  Proxy  ──(API key)──▶  Production API
                      │
                      ├─ Payment verify
                      ├─ Wallet identity
                      ├─ Per-wallet authz
                      ├─ Rate limiting
                      ├─ Discovery doc
                      │
                      └─ Wallet mapping DB
\`\`\`

## How it works

Stand up a separate server (Next.js route handlers are a common choice, but any HTTP framework works). Provision a single API key from your production backend with broad permissions. The proxy acts as a pure consumer of your production API, wrapping each endpoint you want to expose over x402 with a corresponding payable endpoint on the proxy.

All agentic traffic to your production backend appears under a single API key. The complexity of per-wallet accounting stays isolated in the proxy, so your original backend's data model is unchanged.

## Responsibility split

| Concern | Proxy server | Production API |
|---|---|---|
| Payment verification (x402) | ✅ | — |
| Wallet identity | ✅ | — |
| Per-wallet authorization | ✅ | — |
| Per-wallet rate limiting | ✅ | — |
| Discovery document (/openapi.json) | ✅ | — |
| Business logic | — | ✅ |
| User records, billing, quotas | — | ✅ |
| Long-term data storage | — | ✅ |

The proxy owns everything agent-specific. The production API owns everything you already had.

## Wallet identity

Each x402 request carries a signed payment proof. The proxy verifies the signature and treats the signing wallet address as the caller's identity. That wallet address becomes the primary key for owned resources, rate limits, session state, or anything else you track per-caller.

If you also need free endpoints gated by wallet identity without payment, use SIWX (Sign-In with X). The signature flow is the same, but no funds move.

## Wallet-aware authorization

Because every agent call reaches your production API under a single god-key, the proxy must enforce per-wallet authorization itself. The production API will happily return every row the key can see — it's the proxy's job to filter.

Any endpoint that takes a resource ID must verify that the calling wallet owns that resource before proxying through.

## Rate limiting

The god-key is intentionally provisioned with loose or absent rate limits so that legitimate agent traffic isn't throttled. The tradeoff is that the proxy is now the only thing standing between an abusive wallet and your production backend. Apply per-wallet rate limits at the proxy by request count, by spend, or both.

## Failure semantics

x402 settles payment as part of the request. If the downstream call to your production API fails after settlement, you have two options:

1. **Don't settle on failure.** Validate upstream health and cheap preconditions before accepting payment, and return 402 on predictable failures.
2. **Refund on failure.** Catch downstream errors and issue a refund through the settlement network before returning 5xx to the caller.

Pick one policy per endpoint and document it. The worst outcome is silently charging a wallet for a failed request.

## Wallet mapping database

If you need to track which wallets own which resources, a lightweight database alongside the proxy is usually enough. Common tables:

- \`wallet_address → owned_resource_ids\` for ownership lookups.
- \`wallet_address → usage_counters\` for rate limiting and spend caps.
- \`wallet_address → session_state\` for stateful workflows.

All of this sits outside your production database. From the production API's perspective, nothing changed — it still sees a single API key making calls.

## When this pattern fits

- You want to expose existing endpoints over x402 with minimal risk to production.
- Your business logic is already accessible via a clean internal API.
- Per-wallet state is shallow enough to live in a sidecar database.
`;

export function CopyPageButton() {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied page as Markdown');
  });

  return (
    <div className="inline-flex items-center rounded-md border divide-x">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 rounded-r-none border-0"
        onClick={() => void copyToClipboard(PAGE_MARKDOWN)}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy page'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 rounded-l-none border-0"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onClick={() => void copyToClipboard(PAGE_MARKDOWN)}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <div className="flex items-center gap-2 font-medium">
              <Copy className="size-3.5" />
              Copy page
            </div>
            <span className="text-xs text-muted-foreground ml-[22px]">
              Copy page as Markdown for LLMs
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(`Read ${PAGE_URL} and answer my questions about it.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 text-center text-xs">✦</span>
                Open in Claude
                <ExternalLink className="size-3" />
              </div>
              <span className="text-xs text-muted-foreground ml-[22px]">
                Ask questions about this page
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://chatgpt.com/?q=${encodeURIComponent(`Read ${PAGE_URL} and answer my questions about it.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 text-center text-xs">◎</span>
                Open in ChatGPT
                <ExternalLink className="size-3" />
              </div>
              <span className="text-xs text-muted-foreground ml-[22px]">
                Ask questions about this page
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
