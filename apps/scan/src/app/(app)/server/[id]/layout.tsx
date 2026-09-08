import { cleanExternalText } from "@/lib/utils";

import { getServerOrigin } from "./_lib/get-origin";

import type { Metadata } from "next";

export default function OriginLayout({
  children,
}: LayoutProps<"/server/[id]">) {
  return children;
}

export async function generateMetadata({
  params,
}: LayoutProps<"/server/[id]">): Promise<Metadata> {
  const { id } = await params;
  const origin = await getServerOrigin(id);

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
