import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Fiado." },
      { name: "description", content: "Total vendido, recebido, fiado e vencido." },
    ],
  }),
  component: () => <ComingSoon title="Relatórios" description="Total vendido, recebido, fiado e vencido." />,
});
