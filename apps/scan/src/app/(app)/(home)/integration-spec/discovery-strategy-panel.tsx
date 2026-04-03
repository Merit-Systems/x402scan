'use client';

import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StrategyKey = 'openapi' | 'wellKnown';

interface Strategy {
  key: StrategyKey;
  title: string;
  badge: string;
  badgeVariant: 'primary' | 'secondary' | 'outline';
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
    badgeVariant: 'primary',
    subtitle: 'Canonical and most reliable discovery signal.',
    location: 'GET /openapi.json',
    requirements: [
      'Top-level fields: openapi, info.title, info.x-guidance, info.version, paths.',
      'For paid operations: responses.402 and x-payment-info.',
      'Set x-payment-info.protocols and one pricing mode (fixed or dynamic).',
      'Use OpenAPI security + components.securitySchemes for auth declaration.',
      'For SIWX (identity-only) routes: declare a scheme named "siwx" and reference it in security. Do not add x-payment-info.',
      'Add high-level guidance in info.x-guidance for user-friendly discovery.',
    ],
    example: `{
  "openapi": "3.1.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/api/quote": {
      "post": {
        "responses": { "402": { "description": "Payment Required" } },
        "x-payment-info": {
          "protocols": ["x402"],
          "price": { "mode": "fixed", "currency": "USD", "amount": "0.05" }
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
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs">
      <code>{code}</code>
    </pre>
  );
}

function StrategyDetails({ strategy }: { strategy: Strategy }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {strategy.title} Implementation
          </h3>
          <p className="text-sm text-muted-foreground">{strategy.note}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Expected location: <code>{strategy.location}</code>
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {strategy.requirements.map(requirement => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
        <CodeBlock code={strategy.example} />
      </CardContent>
    </Card>
  );
}

export function DiscoveryStrategyPanel() {
  const [selected, setSelected] = useState<StrategyKey>('openapi');
  const [direction, setDirection] = useState(1);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(
    null
  );

  const strategy =
    strategies.find(item => item.key === selected) ?? strategies[0]!;

  useLayoutEffect(() => {
    if (!contentElement) {
      return;
    }

    const updateHeight = () => {
      const height = contentElement.getBoundingClientRect().height;
      if (height > 0) {
        setPanelHeight(previous => (previous === height ? previous : height));
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(contentElement);

    return () => {
      observer.disconnect();
    };
  }, [contentElement]);

  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-3 md:grid-cols-2">
        {strategies.map(item => {
          const active = item.key === selected;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const currentIndex = strategies.findIndex(
                  strategyItem => strategyItem.key === selected
                );
                const nextIndex = strategies.findIndex(
                  strategyItem => strategyItem.key === item.key
                );
                setDirection(nextIndex >= currentIndex ? 1 : -1);
                setSelected(item.key);
              }}
              className={cn(
                'flex h-full cursor-pointer flex-col rounded-md border p-4 text-left transition-colors',
                active
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold leading-tight">
                  {item.title}
                </p>
                <Badge
                  variant={item.badgeVariant}
                  className={cn(
                    'shrink-0',
                    item.badge === 'Recommended' &&
                      'bg-primary/15 text-primary border-primary/40'
                  )}
                >
                  {item.badge}
                </Badge>
              </div>
              <p className="mt-2 min-h-10 text-sm leading-snug text-muted-foreground">
                {item.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 border-t border-border/70 pt-4">
        <motion.div
          initial={false}
          animate={panelHeight === null ? undefined : { height: panelHeight }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={strategy.key}
              ref={setContentElement}
              initial={{ opacity: 0, x: direction * 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction * -14, filter: 'blur(4px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="will-change-transform will-change-[filter]"
            >
              <StrategyDetails strategy={strategy} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
