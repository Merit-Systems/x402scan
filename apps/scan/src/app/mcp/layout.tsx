import { Footer } from '@/app/_components/layout/footer';

import { Navbar } from './_components/layout/navbar';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCP',
  description: 'x402scan MCP - Use x402 in any AI agent',
};

export default function McpLayout({ children }: LayoutProps<'/mcp'>) {
  return (
    <>
      <Navbar />
      <div className="flex flex-col flex-1 py-6 md:py-8">{children}</div>
      <Footer />
    </>
  );
}
