import { env } from "@/env";
import { Subnav } from "../_components/layout/subnav";
import { OnrampSessionDialog } from "./_components/wallet/onramp-session-dialog";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Composer",
    template: "%s | Composer",
  },
  description: "Build and run x402 agents",
};

export default async function ComposerLayout({
  children,
}: LayoutProps<"/composer">) {
  const isEnabled =
    env.NEXT_PUBLIC_ENABLE_COMPOSER === "true" ||
    (await auth())?.user.role === "admin";
  if (!isEnabled) {
    return notFound();
  }
  return (
    <div className="flex flex-1 flex-col">
      <OnrampSessionDialog />
      <Subnav
        tabs={[
          {
            label: "Home",
            href: "/composer",
          },
          {
            label: "Chat",
            href: "/composer/chat",
            subRoutes: ["/composer/chat/"],
          },
          {
            label: "Agents",
            href: "/composer/agents",
            subRoutes: ["/composer/agent/", "/composer/agents/"],
          },
          {
            label: "Feed",
            href: "/composer/feed",
          },
        ]}
      />
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
