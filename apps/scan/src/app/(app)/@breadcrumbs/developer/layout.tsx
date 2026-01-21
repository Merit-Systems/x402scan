import { Code } from 'lucide-react';
import { Breadcrumb } from '../_components/breadcrumb';
import { Separator } from '../_components/separator';

export default function DeveloperBreadcrumbsLayout({
  children,
}: LayoutProps<'/developer'>) {
  return (
    <>
      <Separator />
      <Breadcrumb
        href="/developer"
        image={null}
        name="Developer Hub"
        Fallback={Code}
        mobileHideText
      />
      {children}
    </>
  );
}
