import { headers } from 'next/headers';

import { Nav } from '@/app/(app)/_components/layout/nav';
import { env } from '@/env';
import { cleanExternalText } from '@/lib/utils';
import { api } from '@/trpc/server';
import { getOriginUrl } from '@/services/db/resources/origin';
import { readClaimToken } from '@/services/claim/cookie';
import { getOriginOwnership } from '@/services/claim/session';
import { ClaimTab } from './_components/claim-tab';
import type { Metadata } from 'next';

function hostnameOf(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

export default async function OriginLayout({
  children,
  params,
}: LayoutProps<'/server/[id]'>) {
  const { id } = await params;
  const claimEnabled = env.NEXT_PUBLIC_ENABLE_ORIGIN_CLAIM === 'true';
  const origin = claimEnabled ? await getOriginUrl(id) : null;

  // Resolve ownership server-side from the claim cookie so origin pages don't
  // fire a tRPC round-trip per pageview (and the owner badge has no hydration
  // flash). Only visitors who actually hold a claim cookie hit the DB.
  let isOwner = false;
  if (origin) {
    const token = readClaimToken(await headers());
    if (token) {
      isOwner = (await getOriginOwnership(token, id)).isOwner;
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/server/${id}`,
          },
        ]}
      />
      <div className="relative flex flex-col py-6 md:py-8 flex-1">
        {origin ? (
          // Hangs from the Nav's bottom border (top of this region), right edge
          // aligned to the max-w-6xl content column. pointer-events-none lets the
          // empty strip pass clicks through; the tab itself re-enables them.
          <div className="pointer-events-none absolute inset-x-0 -top-px z-0 mx-auto flex w-full max-w-6xl justify-end px-2">
            <ClaimTab
              originId={id}
              origin={origin.origin}
              originHostname={hostnameOf(origin.origin)}
              isOwner={isOwner}
            />
          </div>
        ) : null}
        {children}
      </div>
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

  const title = origin.title ? cleanExternalText(origin.title) : origin.origin;
  const description = origin.description
    ? cleanExternalText(origin.description)
    : `Explore ${title} on x402scan`;

  const imageUrl = origin.ogImages?.[0]?.url
    ? new URL(origin.ogImages[0].url, env.NEXT_PUBLIC_APP_URL).toString()
    : `${env.NEXT_PUBLIC_APP_URL}/opengraph-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/server/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_APP_URL}/server/${id}`,
      images: [imageUrl],
    },
    twitter: {
      title,
      description,
      images: [imageUrl],
    },
  };
}
