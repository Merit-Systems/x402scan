import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletSpendingTable } from './_components/wallet-spending/table';
import { ToolSpendingTable } from './_components/tool-spending/table';

export default async function ToolSpendingAnalysisPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <div>
      <Heading
        title="Tool Spending Analysis"
        description="Analyze spending patterns and costs associated with tool usage across the platform."
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
            <WalletSpendingTable />
          </TabsContent>

          <TabsContent value="by-tool">
            <ToolSpendingTable />
          </TabsContent>
        </Tabs>
      </Body>
    </div>
  );
}
