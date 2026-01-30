import { Footer } from '@/app/_components/layout/footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCP',
  description: 'x402scan MCP - Use x402 in any AI agent',
};

export default function McpLayout({ children }: LayoutProps<'/mcp'>) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
