import Link from 'next/link';
import { Send, Mail, BookOpen } from 'lucide-react';
import { Body } from '@/app/_components/layout/page-utils';
import { RegisterResourceForm } from './_components/form';
import { DiscoveryActions } from './_components/discovery-actions';
import { ExpandableLink } from './_components/expandable-link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add API',
  description: 'Register your x402-compatible API on x402scan.',
};

export default function RegisterResourcePage() {
  return (
    <div>
      <Body className="max-w-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-bold font-mono">Add your API</h1>
          <p className="text-muted-foreground/80 text-sm md:text-base">
            List your API so agents can find and pay for it.
          </p>
        </div>
        <div className="space-y-4">
          <RegisterResourceForm />
          <div className="flex items-center justify-center gap-x-3 text-sm text-muted-foreground">
            <DiscoveryActions label="Set up x402 with a prompt" />
            <span className="text-muted-foreground/40">·</span>
            <Link
              href="/discovery"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <ExpandableLink label="Support">
              <a
                href="https://t.me/+wj2U7LRDRGs5MTY6"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Send className="size-3.5" />
              </a>
              <a
                href="mailto:merchants@merit.systems"
                className="hover:text-foreground transition-colors"
              >
                <Mail className="size-3.5" />
              </a>
            </ExpandableLink>
          </div>
        </div>
      </Body>
    </div>
  );
}
