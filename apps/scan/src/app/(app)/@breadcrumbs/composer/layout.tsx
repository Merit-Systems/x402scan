import { Network } from 'lucide-react';
import { Breadcrumb } from '../_components/breadcrumb';
import { Separator } from '../_components/separator';

export default function ComposerBreadcrumbsLayout({
  children,
}: LayoutProps<'/composer'>) {
  return (
    <>
      <Separator />
      <Breadcrumb
        href="/composer"
        image={null}
        name="Composer"
        Fallback={Network}
        mobileHideText
      />
      {children}
    </>
  );
}
