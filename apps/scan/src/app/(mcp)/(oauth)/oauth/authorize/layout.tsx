export default function AuthorizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-4 bg-card border-b" />
      {children}
    </div>
  );
}
