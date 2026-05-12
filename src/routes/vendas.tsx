import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — Fiado." },
      { name: "description", content: "Registre vendas fiadas, valores e vencimentos." },
    ],
  }),
  component: () => <ComingSoon title="Vendas" description="Registre vendas fiadas, valores e vencimentos." />,
});
