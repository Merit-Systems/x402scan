import { Nav } from '@/app/(app)/_components/layout/nav';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Hub',
  description: 'Developer tools for x402scan',
};

export default function DeveloperLayout({
  children,
}: LayoutProps<'/developer'>) {
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Resource Preview',
            href: '/developer',
            subRoutes: ['/developer/'],
          },
          //   {
          //     label: 'Delete Resource',
          //     href: '/developer/delete',
          //     subRoutes: ['/developer/delete/'],
          //   },
          // Add more dev tools here as pages are added
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
