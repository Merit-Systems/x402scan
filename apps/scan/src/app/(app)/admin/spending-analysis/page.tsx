import { Body, Heading } from "@/app/_components/layout/page-utils";
import { auth } from "@/auth";
import { forbidden } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletSpendingTable } from "./_components/wallet-spending/table";
import { ToolSpendingTable } from "./_components/tool-spending/table";
import { defaultWalletSpendingSorting } from "@/app/(app)/admin/_contexts/sorting/wallet-spending/default";
import { WalletSpendingSortingProvider } from "@/app/(app)/admin/_contexts/sorting/wallet-spending/provider";
import { defaultToolSpendingSorting } from "@/app/(app)/admin/_contexts/sorting/tool-spending/default";
import { ToolSpendingSortingProvider } from "@/app/(app)/admin/_contexts/sorting/tool-spending/provider";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { ActivityTimeframe } from "@/types/timeframes";

export default async function ToolSpendingAnalysisPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    forbidden();
  }

  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
      <div>
        <Heading
          title="Tool Spending Analysis"
          description="Analyze spending patterns and costs associated with tool usage across the platform."
          actions={<RangeSelector />}
        />
        <Body>
          <Tabs defaultValue="by-wallet" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="by-wallet" appearance="default">
                By Wallet
              </TabsTrigger>
              <TabsTrigger value="by-tool" appearance="default">
                By Tool
              </TabsTrigger>
            </TabsList>
            <TabsContent value="by-wallet">
              <WalletSpendingSortingProvider
                initialSorting={defaultWalletSpendingSorting}
              >
                <WalletSpendingTable />
              </WalletSpendingSortingProvider>
            </TabsContent>

            <TabsContent value="by-tool">
              <ToolSpendingSortingProvider
                initialSorting={defaultToolSpendingSorting}
              >
                <ToolSpendingTable />
              </ToolSpendingSortingProvider>
            </TabsContent>
          </Tabs>
        </Body>
      </div>
    </TimeRangeProvider>
  );
}
