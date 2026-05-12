import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — Fiado." },
      { name: "description", content: "Registre pagamentos totais e parciais." },
    ],
  }),
  component: () => <ComingSoon title="Pagamentos" description="Registre pagamentos totais e parciais." />,
});
