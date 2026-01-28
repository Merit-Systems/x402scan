import { GuideLayout } from '../../_components/guide-layout';

import { KnowledgeWorkPopover } from '../_components/popover';

import { GUIDE_SLUG } from '../_content/data';

export default function KnowledgeWorkLayout({
  children,
}: LayoutProps<'/mcp/guide/knowledge-work/[[...path]]'>) {
  return (
    <GuideLayout guideSlug={[GUIDE_SLUG]} Popover={KnowledgeWorkPopover}>
      {children}
    </GuideLayout>
  );
}
