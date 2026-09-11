import clsx from "clsx";

const CITA_STATES = {
  confirmada: { label: "Confirmada", cls: "bg-sage-50 text-sage-700" },
  pendiente: { label: "Pendiente", cls: "bg-amber-50 text-amber-600" },
  cancelada: { label: "Cancelada", cls: "bg-rose-50 text-rose-600" },
  completada: { label: "Completada", cls: "bg-canvas-sunken text-ink-muted" },
  no_asistio: { label: "No asistió", cls: "bg-rose-100 text-rose-700" },
  disponible: { label: "Disponible", cls: "bg-sage-50 text-sage-700" },
};

export default function StatusBadge({ status, children, className }) {
  const cfg = CITA_STATES[status] || { label: children || status, cls: "bg-canvas-sunken text-ink-muted" };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none",
        cfg.cls,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children || cfg.label}
    </span>
  );
}
