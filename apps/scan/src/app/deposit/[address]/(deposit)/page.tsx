import { Body } from '@/app/_components/layout/page-utils';

import { CopyAddress } from './_components/copy';
import { Deposit } from './_components';

import { ethereumAddressSchema } from '@/lib/schemas';

export default async function DepositPage({
  params,
}: PageProps<'/deposit/[address]'>) {
  const { address } = await params;

  const parsedAddress = ethereumAddressSchema.safeParse(address);

  if (!parsedAddress.success) {
    throw new Error('Invalid address');
  }

  return (
    <div className="flex flex-col flex-1 py-6 md:py-8">
      <Body className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-3xl font-bold font-mono">Add Funds</h1>
            <p className="text-muted-foreground">
              Add USDC to your x402scan MCP to call resources
            </p>
          </div>
          <CopyAddress address={parsedAddress.data} />
        </div>
        <Deposit address={parsedAddress.data} />
      </Body>
    </div>
  );
}
