import { LoadingServerOverview } from "./_components/overview";
import { LoadingOriginResources } from "./_components/resources";
import { LoadingServerStatCards } from "./_components/stat-cards";

export default function LoadingOriginPage() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12"
    >
      <LoadingServerOverview />
      <LoadingServerStatCards />
      <LoadingOriginResources />
    </main>
  );
}
