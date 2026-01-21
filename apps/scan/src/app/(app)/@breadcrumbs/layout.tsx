import { Breadcrumb } from './_components/breadcrumb';

export default function BreadcrumbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb
        href="/"
        image={null}
        Fallback={null}
        name="x402scan"
        textClassName="font-semibold font-mono"
        mobileHideText
      />
      {children}
    </>
  );
}
