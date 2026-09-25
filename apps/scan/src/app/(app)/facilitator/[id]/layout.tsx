export default function FacilitatorLayout({
  children,
}: LayoutProps<"/facilitator/[id]">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
