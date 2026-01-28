import { GuidesHeader } from '../_components/guide-header';
import { getGuide } from '../_lib/mdx';

export default function GuidesLayout({ children }: LayoutProps<'/mcp/guide'>) {
  const guides = getGuide('knowledge-work');
  return (
    <>
      <GuidesHeader guide={guides} />
      <div className="w-full px-[52px]">{children}</div>
    </>
  );
}
