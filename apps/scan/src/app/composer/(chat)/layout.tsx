import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { ReactNode } from 'react';
import { Sidebar } from './_components/sidebar';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden flex flex-col -my-6 md:-my-8 h-[calc(100vh-103px)]">
      <SidebarProvider className="flex-1 h-0 min-h-0">
        <Sidebar />
        <SidebarInset className="max-h-full overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
