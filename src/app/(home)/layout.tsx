import { Nav } from '../_components/layout/nav';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Nav
        layoutId="home-nav-underline"
        tabs={[
          {
            label: 'Overview',
            href: '/',
          },
          {
            label: 'Transactions',
            href: '/transactions',
          },
          {
            label: 'Resources',
            href: '/resources',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
