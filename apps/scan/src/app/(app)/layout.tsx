import { SearchProvider } from "./_contexts/search/provider";
import { ChainProvider } from "./_contexts/chain/provider";
import { Header } from "./_components/layout/header";
import { Footer } from "./_components/layout/footer";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ChainProvider>
      <SearchProvider>
        <Header />
        <div className="flex flex-1 flex-col bg-background">{children}</div>
        <Footer />
      </SearchProvider>
    </ChainProvider>
  );
}
