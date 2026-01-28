import { Navbar } from '../_components/layout/navbar';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCP',
  description: 'x402scan MCP - Use x402 in any AI agent',
};

export default function McpLayout({ children }: LayoutProps<'/mcp'>) {
  return (
    <>
      <Navbar className="sticky top-0 z-50" />
      <div className="flex flex-col flex-1 py-6 md:py-8">{children}</div>
    </>
  );
}
