import { Body } from '@/app/_components/layout/page-utils';
import { Navbar } from '../_components/layout/navbar';

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex flex-col flex-1 py-4 md:py-8">
        <Body className="max-w-3xl mx-auto py-0 md:py-8">{children}</Body>
      </div>
    </>
  );
}
