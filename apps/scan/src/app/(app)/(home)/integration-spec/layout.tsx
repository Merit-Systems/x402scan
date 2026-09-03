import { DocumentationPage } from "@/components/documentation-page";

export default function IntegrationSpecLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
