import { GuidesHeader } from './header/guide-header';

import { getGuide, type Guide } from '../../_lib/mdx';

interface Props {
  children: React.ReactNode;
  guideSlug: string[];
  Popover: React.FC<{ guide: Guide; onClose: () => void }>;
}

export const GuideLayout: React.FC<Props> = async ({
  children,
  guideSlug,
  Popover,
}) => {
  const guide = await getGuide(...guideSlug);
  return (
    <>
      <GuidesHeader guide={guide} Popover={Popover} />
      <div className="w-full px-2 md:px-[52px]">{children}</div>
    </>
  );
};
