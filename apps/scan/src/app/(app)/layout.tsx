import { Footer } from "./_components/layout/footer";
import { Header } from "./_components/layout/header";

export default function AppLayout({ children, chain }: LayoutProps<"/">) {
  return (
    <>
      <Header chainSelector={chain} />
      <div className="flex flex-1 flex-col bg-background">{children}</div>
      <Footer />
    </>
  );
}
