'use client';

import { TriangleAlert } from 'lucide-react';

import Link from 'next/link';

import { DiscoveryActions } from './discovery-actions';

/** Agent prompt for adding info.contact.email — shared by registration + claim. */
const CONTACT_EMAIL_PROMPT = `My openapi.json is missing an info.contact.email field. Add it so I can verify ownership of my origin, let users contact me, and customize my merchant pages on Poncho.

In my openapi.json, add or update the top-level "info" object to include a "contact" field with my email:

{
  "info": {
    "title": "...",
    "version": "...",
    "contact": {
      "email": "me@example.com"
    }
  }
}

IMPORTANT: Do not invent, guess, or use a placeholder email. Ask me directly for the real, legitimate contact email for this origin and wait for my confirmation before writing it into the spec. This email is used to verify ownership, so a fake or wrong address will make the origin unclaimable.

Once I confirm my email, replace me@example.com with it. This is part of the standard OpenAPI 3.x spec (info.contact.email). Do not remove any existing fields — just add the contact object if missing.`;

/**
 * Warning shown when an origin's openapi.json has no info.contact.email. Used in
 * both the registration preview and the claim modal so the guidance is identical.
 */
export function MissingContactEmailWarning() {
  return (
    <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1.5">
      <p className="flex items-start gap-1.5">
        <TriangleAlert className="size-3 shrink-0 mt-0.5" />
        <span>
          Add{' '}
          <code className="font-mono bg-muted px-1 rounded text-[11px]">
            info.contact.email
          </code>{' '}
          to your openapi.json to verify ownership and let users contact you.
        </span>
      </p>
      <p className="pl-[18px] text-foreground">
        <DiscoveryActions
          label="Have your agent add it with this prompt"
          customPrompt={CONTACT_EMAIL_PROMPT}
        />{' '}
        or{' '}
        <Link
          href="/discovery#merchant-dashboard"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          learn more
        </Link>
      </p>
    </div>
  );
}
