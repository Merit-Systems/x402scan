import { Server, Wallet } from 'lucide-react';

import { Breadcrumb } from '../../_components/breadcrumb';

import { Separator } from '../../_components/separator';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';

export default async function OriginLayout({
  params,
  children,
}: LayoutProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);
  if (!origin) {
    return notFound();
  }
  return (
    <>
      <Separator />
      <Breadcrumb
        href={`/resources`}
        image={null}
        name="Server"
        Fallback={Server}
      />
      <Separator className="hidden md:block" />
      <Breadcrumb
        href={`/server/${id}`}
        image={origin.favicon}
        name={origin.title ?? new URL(origin.origin).hostname}
        Fallback={Wallet}
        mobileHideText
        className="hidden md:block min-w-0"
      />
      {children}
    </>
  );
}
