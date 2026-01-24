import { Users } from 'lucide-react';
import { Breadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

export default function McpBreadcrumbsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Separator />
      <Breadcrumb
        href="/admin/mcp/users"
        image={null}
        name="MCP"
        Fallback={Users}
      />
      {children}
    </>
  );
}
