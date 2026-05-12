import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/lembretes")({
  head: () => ({ meta: [{ title: "Lembretes — Fiado." }] }),
  component: () => (
    <AppShell>
      <ComingSoon title="Lembretes" description="Crie lembretes de cobrança e receba notificações no dia certo." />
    </AppShell>
  ),
});
