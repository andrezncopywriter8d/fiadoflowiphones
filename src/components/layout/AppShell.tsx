import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen w-full bg-background p-3 md:p-5 lg:p-6">
      <div className="mx-auto max-w-[1440px] flex bg-surface rounded-[32px] shadow-float overflow-hidden min-h-[calc(100vh-2.5rem)]">
        <Sidebar />
        <main className="flex-1 flex flex-col gap-5 p-4 md:p-6 min-w-0">
          <TopNav />
          <div className="flex-1 rounded-[26px] bg-surface-muted p-5 md:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
