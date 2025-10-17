import { auth } from '@/auth';
import { Nav } from '../_components/layout/nav';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return children;
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
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
