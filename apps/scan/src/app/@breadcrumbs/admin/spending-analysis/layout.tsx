import { ChartLine } from 'lucide-react';
import { Breadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

export default function SpendingAnalysisBreadcrumbsLayout({
  children,
}: LayoutProps<'/admin/spending-analysis'>) {
  return (
    <>
      <Separator />
      <Breadcrumb
        href="/admin/spending-analysis"
        image={null}
        name="Spending Analysis"
        Fallback={ChartLine}
        mobileHideText
      />
      {children}
    </>
  );
}
