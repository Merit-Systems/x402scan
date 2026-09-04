import { DocumentationPage } from "@/components/documentation-page";

export default function X402Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocumentationPage>{children}</DocumentationPage>;
}
