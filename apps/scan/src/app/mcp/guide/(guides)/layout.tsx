import { GuidesHeader } from './_components/header';

export default function GuidesLayout({ children }: LayoutProps<'/mcp/guide'>) {
  return (
    <>
      <GuidesHeader completedCount={0} totalLessons={0} />
      <div className="max-w-2xl mx-auto w-full">{children}</div>
    </>
  );
}
