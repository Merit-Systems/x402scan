export default function DepositLayout({
  children,
}: LayoutProps<'/deposit/[address]'>) {
  return (
    <>
      <div className="h-4 border-b bg-card" />
      {children}
    </>
  );
}
