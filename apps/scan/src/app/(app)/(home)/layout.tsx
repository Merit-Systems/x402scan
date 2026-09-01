export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
