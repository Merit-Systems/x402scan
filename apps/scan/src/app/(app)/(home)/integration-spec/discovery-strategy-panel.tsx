'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StrategyKey = 'openapi' | 'wellKnown' | 'dns';

interface Strategy {
  key: StrategyKey;
  title: string;
  badge: string;
  badgeVariant: 'success' | 'secondary' | 'outline';
  subtitle: string;
  location: string;
  requirements: string[];
  example: string;
  note: string;
}

const strategies: Strategy[] = [
  {
    key: 'openapi',
    title: 'OpenAPI',
    badge: 'Recommended',
    badgeVariant: 'success',
    subtitle: 'Canonical and most reliable discovery signal.',
    location: '/openapi.json or /.well-known/openapi.json',
    requirements: [
      'Top-level fields: openapi, info.title, info.version, paths.',
      'For paid operations: responses.402 and x-payment-info.',
      'Set x-payment-info.protocols and one pricing mode (fixed, range, quote).',
      'Use OpenAPI security + components.securitySchemes for auth declaration.',
    ],
    example: `{
  "openapi": "3.1.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/api/quote": {
      "post": {
        "security": [{ "siwx": [] }],
        "responses": { "402": { "description": "Payment Required" } },
        "x-payment-info": {
          "protocols": ["x402"],
          "pricingMode": "fixed",
          "price": "0.05"
        }
      }
    }
  }
}`,
    note: 'Use this first. It gives the cleanest machine-readable contract and best tooling compatibility.',
  },
  {
    key: 'wellKnown',
    title: 'Well-Known',
    badge: 'Compat',
    badgeVariant: 'secondary',
    subtitle: 'Fan-out fallback for migrations from legacy discovery.',
    location: 'GET /.well-known/x402',
    requirements: [
      'Return a v1 document with a resources array.',
      'Each resource should be a full URL.',
      'Optional ownershipProofs may be included for ownership UX.',
    ],
    example: `{
  "version": 1,
  "resources": [
    "https://yourdomain.com/api/route-1",
    "https://yourdomain.com/api/route-2"
  ],
  "ownershipProofs": ["0x..."]
}`,
    note: 'Good for compatibility and fan-out, but OpenAPI should be your long-term source of truth.',
  },
  {
    key: 'dns',
    title: 'DNS Pointer',
    badge: 'Legacy',
    badgeVariant: 'outline',
    subtitle: 'Oldest compatibility mode. Keep only if needed.',
    location: 'TXT record at _x402.<domain>',
    requirements: [
      'TXT value should point to your /.well-known/x402 URL.',
      'Keep the pointed URL stable and cache-friendly.',
      'Plan migration away from DNS-only discovery.',
    ],
    example:
      '_x402.yourdomain.com TXT "v=x4021;url=https://yourdomain.com/.well-known/x402"',
    note: 'Supported for backward compatibility, but lowest priority and least expressive.',
  },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md border bg-muted p-3 overflow-x-auto text-xs md:text-sm">
      <code>{code}</code>
    </pre>
  );
}

export function DiscoveryStrategyPanel() {
  const [selected, setSelected] = useState<StrategyKey>('openapi');
  const strategy = strategies.find(item => item.key === selected) ?? strategies[0]!;

  return (
    <div className="space-y-4 rounded-xl bg-muted/30 p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-3">
        {strategies.map(item => {
          const active = item.key === selected;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(item.key)}
              className={cn(
                'rounded-lg text-left p-4 transition-colors',
                'bg-background/80 hover:bg-background',
                active && 'ring-1 ring-primary bg-background'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold">{item.title}</p>
                <Badge variant={item.badgeVariant}>{item.badge}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-background p-4 md:p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {strategy.title} Implementation
            <Badge variant={strategy.badgeVariant}>{strategy.badge}</Badge>
          </h3>
          <p className="text-sm text-muted-foreground">{strategy.note}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Expected location: <code>{strategy.location}</code>
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
          {strategy.requirements.map(requirement => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
        <CodeBlock code={strategy.example} />
      </div>
    </div>
  );
}
