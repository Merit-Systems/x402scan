import { ethereumAddressSchema } from '@/lib/schemas';

export default async function DepositLayout({
  children,
  params,
}: LayoutProps<'/mcp/deposit/[address]'>) {
  const { address } = await params;

  const parsedAddress = ethereumAddressSchema.safeParse(address);

  if (!parsedAddress.success) {
    throw new Error(errorMessage);
  }

  return children;
}

const errorMessage = `This address is not valid. Please run:

\`npx agentcash fund\` to get a deposit URL.`;
