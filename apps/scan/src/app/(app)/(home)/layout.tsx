import { Nav } from '../_components/layout/nav';
import { Footer } from '../../_components/layout/footer';

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
            href: '/composer' as const,
            subRoutes: ['/composer/chat', '/composer/agent'],
          },
          {
            label: 'Marketplace',
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
            label: 'Networks',
            href: '/networks',
          },
          {
            label: 'Ecosystem',
            href: '/ecosystem',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
      <Footer />
    </div>
  );
}
