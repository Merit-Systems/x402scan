import { DocumentationPage } from "@/components/documentation-page";

export default function DiscoveryLayout({
  children,
}: LayoutProps<"/discovery">) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
