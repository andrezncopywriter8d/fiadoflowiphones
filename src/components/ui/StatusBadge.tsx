import { statusClasses, statusLabel, type SaleStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  const s = (status as SaleStatus) ?? "pendente";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-medium ${
        statusClasses[s] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {statusLabel[s] ?? status}
    </span>
  );
}
