import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletSpendingTable } from './_components/wallet-spending/table';
import { ToolSpendingTable } from './_components/tool-spending/table';
import { defaultWalletSpendingSorting } from '@/app/_contexts/sorting/wallet-spending/default';
import { WalletSpendingSortingProvider } from '@/app/_contexts/sorting/wallet-spending/provider';
import { defaultToolSpendingSorting } from '@/app/_contexts/sorting/tool-spending/default';
import { ToolSpendingSortingProvider } from '@/app/_contexts/sorting/tool-spending/provider';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { ActivityTimeframe } from '@/types/timeframes';
import { subDays } from 'date-fns';

export default async function ToolSpendingAnalysisPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <TimeRangeProvider
      creationDate={subDays(new Date(), 365)}
      initialTimeframe={ActivityTimeframe.ThirtyDays}
    >
      <div>
        <Heading
          title="Tool Spending Analysis"
          description="Analyze spending patterns and costs associated with tool usage across the platform."
          actions={<RangeSelector />}
        />
        <Body>
          <Tabs defaultValue="by-wallet" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="by-wallet" variant="underline">
                By Wallet
              </TabsTrigger>
              <TabsTrigger value="by-tool" variant="underline">
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
