export type SaleStatus = "pago" | "pendente" | "parcial" | "vencido" | "cancelado";

export const statusLabel: Record<SaleStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  parcial: "Parcial",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const statusClasses: Record<SaleStatus, string> = {
  pago: "bg-success/15 text-success",
  pendente: "bg-warning/15 text-warning",
  parcial: "bg-primary/15 text-primary",
  vencido: "bg-destructive/15 text-destructive",
  cancelado: "bg-muted text-muted-foreground",
};

export function computeStatus(
  valor_total: number,
  valor_pago: number,
  data_vencimento: string | null
): SaleStatus {
  if (valor_pago >= valor_total && valor_total > 0) return "pago";
  const overdue =
    !!data_vencimento && new Date(data_vencimento + "T23:59:59") < new Date();
  if (valor_pago > 0 && valor_pago < valor_total) return overdue ? "vencido" : "parcial";
  return overdue ? "vencido" : "pendente";
}
