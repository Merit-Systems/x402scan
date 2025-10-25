import { Geist, Geist_Mono } from 'next/font/google';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { ThemeProvider } from 'next-themes';

import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { Toaster } from '@/components/ui/sonner';

import { LogoContainer } from './_components/layout/logo';
import { NavbarSearchButton } from './_components/layout/navbar/search';
import { NavbarAuthButton } from './_components/layout/navbar/auth-button';

import { CDPHooksProvider } from './_contexts/cdp';
import { SearchProvider } from './_contexts/search/provider';
import { WagmiProvider } from './_contexts/wagmi';
import { PostHogProvider } from './_contexts/posthog';
import { ChainProvider } from './_contexts/chain/provider';

import { TRPCReactProvider } from '@/trpc/client';

import { env } from '@/env';

import type { Metadata, Viewport } from 'next';

import { SessionProvider } from 'next-auth/react';
import { ChainSelector } from './_components/layout/navbar/chain-selector';

import { connection } from 'next/server';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'x402scan • x402 Ecosystem Explorer',
    template: '%s | x402scan',
  },
  description:
    'Explore the x402 ecosystem. View transactions, sellers, origins and resources. Explore the future of agentic commerce.',
  keywords: [
    'x402',
    'blockchain',
    'ecosystem',
    'transactions',
    'agentic commerce',
    'crypto',
    'web3',
    'block explorer',
    'analytics',
    'sellers',
  ],
  authors: [{ name: 'x402scan' }],
  creator: 'x402scan',
  publisher: 'x402scan',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: env.NEXT_PUBLIC_APP_URL,
    title: 'x402scan • x402 Ecosystem Explorer',
    description:
      'Explore the x402 ecosystem. View transactions, sellers, origins and resources. Explore the future of agentic commerce.',
    siteName: 'x402scan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'x402scan • x402 Ecosystem Explorer',
    description:
      'Explore the x402 ecosystem. View transactions, sellers, origins and resources. Explore the future of agentic commerce.',
    creator: '@x402scan',
  },
  appleWebApp: {
    title: 'x402scan',
    statusBarStyle: 'black-translucent',
  },
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
};

export const viewport: Viewport = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090909' },
    { media: '(prefers-color-scheme: light)', color: 'white' },
  ],
};

export default async function RootLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
  await connection();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <SpeedInsights />
        <Analytics />
        <SessionProvider>
          <ChainProvider>
            <TRPCReactProvider>
              <SearchProvider>
                <CDPHooksProvider>
                  <WagmiProvider>
                    <PostHogProvider>
                      <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        storageKey="x402scan-theme"
                        enableSystem={true}
                      >
                        <div className="min-h-screen flex flex-col relative">
                          <LogoContainer>
                            <Link href="/" prefetch={false}>
                              <Logo className="size-full aspect-square" />
                            </Link>
                          </LogoContainer>
                          <header className="w-full flex flex-col pt-4 justify-center bg-card">
                            <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0 h-10">
                              <div className="pl-8 md:pl-8 flex items-center gap-2 md:gap-3">
                                {breadcrumbs}
                              </div>
                              <div className="flex items-center gap-1 md:gap-2">
                                <ChainSelector />
                                <NavbarSearchButton />
                                <NavbarAuthButton />
                                <a
                                  href="https://github.com/Merit-Systems/x402scan"
                                  target="_blank"
                                >
                                  <Button variant="outline" size={'icon'}>
                                    <Image
                                      src="/github.png"
                                      alt="GitHub"
                                      width={16}
                                      height={16}
                                      className="size-4"
                                    />
                                  </Button>
                                </a>
                                <AnimatedThemeToggler />
                              </div>
                            </div>
                          </header>
                          <div className="bg-background flex-1 flex flex-col">
                            {children}
                          </div>
                        </div>
                      </ThemeProvider>
                    </PostHogProvider>
                  </WagmiProvider>
                </CDPHooksProvider>
              </SearchProvider>
            </TRPCReactProvider>
          </ChainProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
