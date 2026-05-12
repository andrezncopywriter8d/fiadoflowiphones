import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/cobrancas")({
  head: () => ({
    meta: [
      { title: "Cobranças — Fiado." },
      { name: "description", content: "Cobranças de hoje, vencidas e próximas." },
    ],
  }),
  component: () => <ComingSoon title="Cobranças" description="Cobranças de hoje, vencidas e próximas." />,
});
