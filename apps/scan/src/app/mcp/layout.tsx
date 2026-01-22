import { Footer } from '@/app/_components/layout/footer';

import type { Metadata } from 'next';
import { Navbar } from './_components/layout/navbar';
import { ScrollBehaviorProvider } from './_components/scroll-behavior-provider';

export const metadata: Metadata = {
  title: 'MCP',
  description: 'x402scan MCP - Use x402 in any AI agent',
};

export default function McpLayout({ children }: LayoutProps<'/mcp'>) {
  return (
    <ScrollBehaviorProvider>
      <Navbar />
      <div className="flex flex-col flex-1 py-6 md:py-8 pt-16 md:pt-20">
        {children}
      </div>
      <Footer />
    </ScrollBehaviorProvider>
  );
}
