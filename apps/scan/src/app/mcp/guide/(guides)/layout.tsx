import { GuidesHeader } from '../_components/guide-header';
import { getGuides } from '../_lib/mdx';

export default async function GuidesLayout({
  children,
}: LayoutProps<'/mcp/guide'>) {
  const guides = await getGuides();
  return (
    <>
      <GuidesHeader guides={guides} />
      <div className="w-full px-[52px]">{children}</div>
    </>
  );
}
