import { toast } from "sonner";
import appLogo from "@/assets/fiado-logo.png";
import { brl } from "@/lib/format";

type DopamineToastKind = "sale" | "charge";

type DopamineToastOptions = {
  kind: DopamineToastKind;
  title: string;
  description: string;
  amount?: number;
  label?: string;
};

export function showDopamineToast({
  kind,
  title,
  description,
  amount,
  label = "agora",
}: DopamineToastOptions) {
  toast.custom(
    (id) => (
      <button
        type="button"
        className={`dopamine-toast dopamine-toast-${kind}`}
        onClick={() => toast.dismiss(id)}
      >
        <span className="dopamine-glow" />
        <span className="dopamine-logo">
          <img src={appLogo} alt="" />
        </span>
        <span className="dopamine-copy">
          <strong>{title}</strong>
          <span>{description}</span>
          {amount !== undefined && <em>{brl(amount)}</em>}
        </span>
        <span className="dopamine-time">{label}</span>
      </button>
    ),
    { duration: 5600 },
  );
}

export function notifyNewSale({
  clientName,
  amount,
  payment,
}: {
  clientName: string;
  amount: number;
  payment: string;
}) {
  showDopamineToast({
    kind: "sale",
    title: "Venda registrada!",
    description: `${clientName} • ${payment}`,
    amount,
  });
}

export function notifyChargeSent({
  clientName,
  amount,
  product,
}: {
  clientName: string;
  amount: number;
  product: string;
}) {
  showDopamineToast({
    kind: "charge",
    title: "Cobrança enviada!",
    description: `${clientName} • ${product}`,
    amount,
  });
}
