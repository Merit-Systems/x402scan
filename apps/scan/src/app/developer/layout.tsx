import { Nav } from '@/app/_components/layout/nav';

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
