import type { ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen w-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-4 p-4 md:p-5 min-w-0 bg-surface">
        <TopNav />
        <div className="flex-1 rounded-[24px] bg-surface-muted p-5 md:p-7 overflow-auto contain-content">
          <div key={pathname} className="section-slide">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
