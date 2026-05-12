import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/lembretes")({
  head: () => ({ meta: [{ title: "Lembretes — Fiado." }] }),
  component: () => <ComingSoon title="Lembretes" description="Crie lembretes de cobrança e receba notificações no dia certo." />,
});
