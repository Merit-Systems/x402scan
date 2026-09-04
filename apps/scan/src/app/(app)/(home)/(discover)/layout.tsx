import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function DiscoverLayout({ children }: LayoutProps<"/">) {
  return children;
}
