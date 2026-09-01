import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "./_components/sidebar";

import type { ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-my-6 flex h-[calc(100vh-103px)] flex-col overflow-hidden md:-my-8">
      <SidebarProvider className="h-0 min-h-0 flex-1">
        <Sidebar />
        <SidebarInset className="max-h-full overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
