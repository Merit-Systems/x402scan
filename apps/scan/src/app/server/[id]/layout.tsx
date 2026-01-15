import { Nav } from '@/app/_components/layout/nav';
import { env } from '@/env';
import { api } from '@/trpc/server';
import type { Metadata } from 'next';

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

export async function generateMetadata({
  params,
}: LayoutProps<'/server/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return { title: 'Server not found' };
  }

  const title = origin.title ?? origin.origin;
  const description = origin.description ?? `Explore ${title} on x402scan`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_APP_URL}/server/${id}`,
    },
    twitter: {
      title,
      description,
    },
  };
}
