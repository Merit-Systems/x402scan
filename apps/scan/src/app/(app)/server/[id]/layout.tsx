import { notFound } from "next/navigation";

import { cleanExternalText } from "@/lib/utils";
import { api } from "@/trpc/server";

import type { Metadata } from "next";

export default async function OriginLayout({
  params,
  children,
}: LayoutProps<"/server/[id]">) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    notFound();
  }

  return children;
}

export async function generateMetadata({
  params,
}: LayoutProps<"/server/[id]">): Promise<Metadata> {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return { title: "Server not found" };
  }

  const title = origin.title ? cleanExternalText(origin.title) : origin.origin;
  const description = origin.description
    ? cleanExternalText(origin.description)
    : `Explore ${title} on x402scan`;

  return {
    title,
    description,
    alternates: {
      canonical: `/server/${id}`,
    },
  };
}
