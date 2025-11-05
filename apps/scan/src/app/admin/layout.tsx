import { auth } from '@/auth';
import { Nav } from '../_components/layout/nav';
import { forbidden } from 'next/navigation';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Tags',
            href: '/admin/tags',
          },
          {
            label: 'Request Metadata',
            href: '/admin/request-metadata',
          },
          {
            label: 'Excluded Resources',
            href: '/admin/excludes',
          },
          {
            label: 'Free Tier Wallet',
            href: '/admin/free-tier',
          },
          {
            label: 'Resource Search',
            href: '/admin/resource-search',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
