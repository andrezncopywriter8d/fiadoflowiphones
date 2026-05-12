import { brl, fmtDate, onlyDigits } from "./format";

export type WppTone = "amigavel" | "direta" | "atraso";

export const wppTemplates: { key: WppTone; label: string; build: (p: WppParams) => string }[] = [
  {
    key: "amigavel",
    label: "Amigável",
    build: (p) =>
      `Olá, ${p.nome}! Tudo bem? Passando para lembrar que existe um pagamento em aberto no valor de ${brl(
        p.valor
      )}, referente à compra do dia ${fmtDate(p.data)}. Assim que puder, me avise sobre o pagamento. Obrigado!`,
  },
  {
    key: "direta",
    label: "Direta",
    build: (p) =>
      `Olá, ${p.nome}. Identificamos que seu pagamento de ${brl(p.valor)} venceu em ${fmtDate(
        p.data
      )}. Poderia nos dar um retorno sobre a previsão de pagamento?`,
  },
  {
    key: "atraso",
    label: "Em atraso",
    build: (p) =>
      `Olá, ${p.nome}. Seu pagamento de ${brl(p.valor)} está em atraso desde ${fmtDate(
        p.data
      )}. Precisamos regularizar essa pendência. Por favor, nos envie uma previsão de pagamento.`,
  },
];

export interface WppParams {
  nome: string;
  valor: number;
  data: string;
}

export function openWhatsApp(phone: string, message: string) {
  const digits = onlyDigits(phone);
  const full = digits.length >= 11 ? `55${digits}` : digits;
  const url = `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}
