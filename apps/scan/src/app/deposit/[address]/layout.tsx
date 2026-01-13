import { ethereumAddressSchema } from '@/lib/schemas';

export default async function DepositLayout({
  children,
  params,
}: LayoutProps<'/deposit/[address]'>) {
  const { address } = await params;

  const parsedAddress = ethereumAddressSchema.safeParse(address);

  if (!parsedAddress.success) {
    throw new Error('Invalid address');
  }

  return (
    <>
      <div className="h-4 border-b bg-card" />
      <div className="flex flex-col flex-1 py-6 md:py-8">{children}</div>
    </>
  );
}
