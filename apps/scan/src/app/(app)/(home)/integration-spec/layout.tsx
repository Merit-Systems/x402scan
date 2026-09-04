import { DocumentationPage } from "@/components/documentation-page";

export default function IntegrationSpecLayout({
  children,
}: LayoutProps<"/integration-spec">) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
