import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] flex bg-surface rounded-[32px] shadow-float overflow-hidden min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 flex flex-col gap-5 p-5 md:p-6">
          <TopNav />
          <div className="flex-1 rounded-[26px] bg-surface-muted p-5 md:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
