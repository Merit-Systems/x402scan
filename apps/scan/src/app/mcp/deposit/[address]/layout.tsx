import { ethereumAddressSchema } from '@/lib/schemas';

export default async function DepositLayout({
  children,
  params,
}: LayoutProps<'/mcp/deposit/[address]'>) {
  const { address } = await params;

  const parsedAddress = ethereumAddressSchema.safeParse(address);

  if (!parsedAddress.success) {
    throw new Error('Invalid address');
  }

  return children;
}
