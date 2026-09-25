import { DocumentationPage } from "@/components/documentation-page";

export default function AgenticCommerceLayout({
  children,
}: LayoutProps<"/agentic-commerce">) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
