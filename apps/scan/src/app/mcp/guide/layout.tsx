import { Body } from '@/app/_components/layout/page-utils';

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Body className="max-w-3xl mx-auto">{children}</Body>;
}
