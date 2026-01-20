import { Footer } from '../_components/layout/footer';

export default function McpLayout({ children }: LayoutProps<'/mcp'>) {
  return (
    <>
      <div className="h-4 border-b bg-card" />
      <div className="flex flex-col flex-1 py-6 md:py-8">{children}</div>
      <Footer />
    </>
  );
}
