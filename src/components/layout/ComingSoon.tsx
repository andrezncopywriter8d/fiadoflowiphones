import { AppShell } from "@/components/layout/AppShell";
import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <AppShell>
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center max-w-md">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-surface grid place-items-center shadow-soft">
            <Construction className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">{description}</p>
          <p className="mt-6 text-[11px] text-muted-foreground">
            Esta página será construída na próxima etapa, seguindo o mesmo padrão visual do dashboard.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
