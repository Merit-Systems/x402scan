import { ethereumAddressSchema } from '@/lib/schemas';
import { Deposit } from './_components';
import { WalletChainProvider } from '@/app/_contexts/wallet-chain/provider';
import { Chain } from '@/types/chain';
import { Body, Heading } from '@/app/_components/layout/page-utils';

export default async function DepositPage({
  params,
}: PageProps<'/deposit/[address]'>) {
  const { address } = await params;

  const parsedAddress = ethereumAddressSchema.safeParse(address);

  if (!parsedAddress.success) {
    throw new Error('Invalid address');
  }

  return (
    <>
      <div className="h-4 border-b bg-card" />
      <div className="flex flex-col flex-1 py-6 md:py-8">
        <WalletChainProvider initialChain={Chain.BASE} isFixed>
          <Body className="max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-3xl font-bold font-mono">Add Funds</h1>
              <p className="text-muted-foreground">
                Add USDC to your x402scan MCP to call resources
              </p>
            </div>

            <Deposit address={parsedAddress.data} />
          </Body>
        </WalletChainProvider>
      </div>
    </>
  );
}
