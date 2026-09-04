import { DocumentationPage } from "@/components/documentation-page";

export default function AgenticCommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
