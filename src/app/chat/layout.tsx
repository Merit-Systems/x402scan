import type { ReactNode } from 'react';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-theme(spacing.4))]">
      {children}
    </div>
  );
}
