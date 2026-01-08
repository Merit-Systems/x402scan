'use client';

import { useState } from 'react';
import { Info, Copy, Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NgrokAlertProps {
  port: string | null;
}

export function NgrokAlert({ port }: NgrokAlertProps) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const ngrokCommand = `ngrok http ${port ?? '3000'}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ngrokCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex gap-3">
        <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
            Need to test a local endpoint?
          </h3>
          <div className="text-sm space-y-3 text-blue-800 dark:text-blue-200">
            <p>
              x402scan runs in production and can&apos;t reach localhost URLs.
              Use <strong>ngrok</strong> to create a public tunnel to your local
              server.
            </p>

            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-md p-3 font-mono text-xs flex items-center justify-between gap-2">
              <code className="flex-1">{ngrokCommand}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleCopy()}
                className="h-7 px-2 shrink-0"
              >
                {copied ? (
                  <Check className="size-3 text-green-600" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Show detailed instructions →
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>
                    Install ngrok:{' '}
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
                      brew install ngrok
                    </code>{' '}
                    or{' '}
                    <a
                      href="https://ngrok.com/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      download
                      <ExternalLink className="size-3" />
                    </a>
                  </li>
                  <li>
                    Run the command above in your terminal (make sure your local
                    server is running)
                  </li>
                  <li>
                    Copy the <strong>HTTPS</strong> URL from ngrok output (e.g.,{' '}
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
                      https://abc123.ngrok.io
                    </code>
                    )
                  </li>
                  <li>
                    Replace your localhost URL with the ngrok URL and test again
                  </li>
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
