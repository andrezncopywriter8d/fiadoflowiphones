import appLogo from "@/assets/fiado-logo.png";

export function AppLogo({ showName = true }: { showName?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-border">
        <img src={appLogo} alt="Fiado." className="h-full w-full object-cover" />
      </span>
      {showName && (
        <span className="text-[14px] font-semibold tracking-tight text-foreground/85">
          Fia<span className="text-primary">do</span>.
        </span>
      )}
    </div>
  );
}
