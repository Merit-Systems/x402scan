import { Body } from '@/app/_components/layout/page-utils';

import { CopyAddress } from './_components/copy';
import { Deposit } from './_components';

import type { Address } from 'viem';
import { depositSearchParamsSchema } from '../_lib/params';

export default async function DepositPage({
  params,
  searchParams,
}: PageProps<'/mcp/deposit/[address]'>) {
  const { address: untypedAddress } = await params;
  const address = untypedAddress as Address;

  const parsedSearchParams = depositSearchParamsSchema.safeParse(
    await searchParams
  );

  return (
    <Body className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-3xl font-bold font-mono">Add Funds</h1>
          <p className="text-muted-foreground">
            Add USDC to your x402scan MCP to call resources
          </p>
        </div>
        <CopyAddress address={address} />
      </div>
      <Deposit address={address} searchParams={parsedSearchParams.data} />
    </Body>
  );
}
