import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Fiado." },
      { name: "description", content: "Cadastre e gerencie todos os seus clientes." },
    ],
  }),
  component: () => <ComingSoon title="Clientes" description="Cadastre e gerencie todos os seus clientes." />,
});
