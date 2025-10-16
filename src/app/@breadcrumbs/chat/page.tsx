import { MessageSquare } from 'lucide-react';

import { Breadcrumb } from '../_components/breadcrumb';
import { Separator } from '../_components/separator';

export default function ChatBreadcrumb() {
  return (
    <>
      <Separator className="hidden md:block" />
      <Breadcrumb
        href="/chat"
        image={null}
        name="Chat"
        Fallback={MessageSquare}
      />
    </>
  );
}
