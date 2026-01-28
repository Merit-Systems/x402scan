import { GuidesHeader } from './header/guide-header';

import { getGuide, type Guide } from '../_lib/mdx';

interface Props {
  children: React.ReactNode;
  guideSlug: string[];
  Popover: React.FC<{ guide: Guide }>;
}

export const GuideLayout: React.FC<Props> = ({
  children,
  guideSlug,
  Popover,
}) => {
  const guide = getGuide(...guideSlug);
  return (
    <>
      <GuidesHeader guide={guide} Popover={Popover} />
      <div className="w-full px-[52px]">{children}</div>
    </>
  );
};
