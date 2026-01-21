import { Geist, Geist_Mono } from 'next/font/google';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ThemeProvider } from 'next-themes';

import { Toaster } from '@/components/ui/sonner';

import { CDPHooksProvider } from './_contexts/cdp';
import { WagmiProvider } from './_contexts/wagmi';
import { PostHogProvider } from './_contexts/posthog';

import { TRPCReactProvider } from '@/trpc/client';

import { env } from '@/env';

import type { Metadata, Viewport } from 'next';

import { SessionProvider } from 'next-auth/react';

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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <SpeedInsights />
        <Analytics />
        <SessionProvider>
          <TRPCReactProvider>
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
                      {children}
                      {(env.NEXT_PUBLIC_NODE_ENV === 'development' ||
                        env.NEXT_PUBLIC_VERCEL_ENV !== 'production') && (
                        <ReactQueryDevtools />
                      )}
                    </div>
                  </ThemeProvider>
                </PostHogProvider>
              </WagmiProvider>
            </CDPHooksProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
