import { Body } from '@/app/_components/layout/page-utils';

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Body className="max-w-2xl mx-auto">{children}</Body>;
}
