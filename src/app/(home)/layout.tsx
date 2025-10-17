import { Nav } from '../_components/layout/nav';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: '/',
          },
          {
            label: 'Composer',
            href: '/chat',
            subRoutes: ['/chat/'],
            isNew: true,
          },
          {
            label: 'Resources',
            href: '/resources',
            subRoutes: ['/resources/register'],
          },
          {
            label: 'Transactions',
            href: '/transactions',
          },
          {
            label: 'Facilitators',
            href: '/facilitators',
          },
          {
            label: 'Ecosystem',
            href: '/ecosystem',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
