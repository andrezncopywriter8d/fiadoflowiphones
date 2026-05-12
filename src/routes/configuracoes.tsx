import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Fiado." },
      { name: "description", content: "Loja, Pix, modelos de mensagem e usuário." },
    ],
  }),
  component: () => <ComingSoon title="Configurações" description="Loja, Pix, modelos de mensagem e usuário." />,
});
