import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';

export default async function ObservabilityPage({
  params,
}: PageProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return notFound();
  }

  return (
    <Body className="pt-0">
    </Body>
  );
}
