import { Geist, Geist_Mono } from 'next/font/google';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { ThemeProvider } from 'next-themes';

import { RootProvider } from 'fumadocs-ui/provider/next';

import { Toaster } from '@/components/ui/sonner';

import { CDPHooksProvider } from './(app)/_contexts/cdp';
import { SearchProvider } from './(app)/_contexts/search/provider';
import { WagmiProvider } from './(app)/_contexts/wagmi';
import { PostHogProvider } from './(app)/_contexts/posthog';

import { TRPCReactProvider } from '@/trpc/client';

import { env } from '@/env';

import type { Metadata, Viewport } from 'next';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Header } from './(app)/_components/layout/header';

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

export default function RootLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootProvider>
          <Toaster />
          <SpeedInsights />
          <Analytics />
          <SessionProvider>
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
                          <Header breadcrumbs={breadcrumbs} />
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
          </SessionProvider>
        </RootProvider>
      </body>
    </html>
  );
}
