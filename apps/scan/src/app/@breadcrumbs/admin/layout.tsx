import { ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '../_components/breadcrumb';
import { Separator } from '../_components/separator';

export default function AdminBreadcrumbsLayout({
  children,
}: LayoutProps<'/admin'>) {
  return (
    <>
      <Separator />
      <Breadcrumb
        href="/admin/tags"
        image={null}
        name="Admin"
        Fallback={ShieldCheck}
        mobileHideText
      />
      {children}
    </>
  );
}
