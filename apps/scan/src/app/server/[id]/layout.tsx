import { Nav } from '@/app/_components/layout/nav';

export default async function OriginLayout({
  children,
  params,
}: LayoutProps<'/server/[id]'>) {
  const { id } = await params;
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/server/${id}`,
          },
          {
            label: 'Agents',
            href: `/server/${id}/agents`,
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
