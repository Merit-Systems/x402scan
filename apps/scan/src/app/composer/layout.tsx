import { env } from '@/env';
import { Nav } from '../_components/layout/nav';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';

export default async function ComposerLayout({
  children,
}: LayoutProps<'/composer'>) {
  const isEnabled =
    env.NEXT_PUBLIC_ENABLE_COMPOSER === 'true' ||
    (await auth())?.user.role === 'admin';
  if (!isEnabled) {
    return notFound();
  }
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Home',
            href: '/composer',
          },
          {
            label: 'Chat',
            href: '/composer/chat',
            subRoutes: ['/composer/chat/'],
          },
          {
            label: 'Agents',
            href: '/composer/agents',
            subRoutes: ['/composer/agent/', '/composer/agents/'],
          },
          {
            label: 'Feed',
            href: '/composer/feed',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
