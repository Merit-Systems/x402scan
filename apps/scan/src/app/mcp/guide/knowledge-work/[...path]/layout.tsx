import { GuideLayout } from '../../_components/guide-layout';

import { KnowledgeWorkPopover } from '../_components/popover';

export default function KnowledgeWorkLayout({
  children,
}: LayoutProps<'/mcp/guide'>) {
  return (
    <GuideLayout guideSlug={['knowledge-work']} Popover={KnowledgeWorkPopover}>
      {children}
    </GuideLayout>
  );
}
