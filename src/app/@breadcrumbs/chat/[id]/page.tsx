import { MessageSquare } from 'lucide-react';

import { Breadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

export default async function ChatBreadcrumb({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Separator className="hidden md:block" />
      <Breadcrumb
        href={`/chat/${id}`}
        image={null}
        name="Chat"
        Fallback={MessageSquare}
      />
    </>
  );
}
