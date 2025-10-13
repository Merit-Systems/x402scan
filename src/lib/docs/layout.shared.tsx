import Image from 'next/image';

import { Logo } from '@/components/logo';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <div>
            <h1 className="text-xl font-bold font-mono leading-none">
              x402scan
            </h1>
            <p className="text-sm text-muted-foreground">Docs</p>
          </div>
        </div>
      ),
    },
    githubUrl: 'https://github.com/Merit-Systems/x402scan',
    links: [
      {
        url: 'https://github.com/Merit-Systems/x402scan',
        text: 'Source Code',
        icon: (
          <Image
            src="/github.png"
            alt="GitHub"
            width={16}
            height={16}
            className="size-4 dark:invert"
          />
        ),
      },
    ],
  };
}
