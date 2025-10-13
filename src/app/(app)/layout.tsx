import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';

import { CDPHooksProvider } from './_contexts/cdp';
import { SearchProvider } from './_contexts/search/provider';
import { WagmiProvider } from './_contexts/wagmi';
import { PostHogProvider } from './_contexts/posthog';

import { TRPCReactProvider } from '@/trpc/client';

import { Header } from './_components/layout/header';

export default function RootLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
  return (
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
  );
}
