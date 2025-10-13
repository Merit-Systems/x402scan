export default function TransactionLayout({
  children,
}: LayoutProps<'/transaction/[hash]'>) {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-4 border-b bg-card" />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
