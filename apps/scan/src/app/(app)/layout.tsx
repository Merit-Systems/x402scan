import { Footer } from "./_components/layout/footer";
import { Header } from "./_components/layout/header";
import { ChainProvider } from "./_contexts/chain/provider";
import { SearchProvider } from "./_contexts/search/provider";

import { getDataChainCookieServer } from "./_contexts/chain/cookies/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const initialChain = await getDataChainCookieServer();

  return (
    <ChainProvider initialChain={initialChain}>
      <SearchProvider>
        <Header />
        <div className="flex flex-1 flex-col bg-background">{children}</div>
        <Footer />
      </SearchProvider>
    </ChainProvider>
  );
}
