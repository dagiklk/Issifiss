import clsx from "clsx";
import { Clock } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { patientFullName } from "../../../lib/clinicData.js";

const DOT = {
  sage: "bg-sage-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export default function AppointmentCard({ cita, onClick, compact }) {
  const { paciente, tratamiento, horaInicio, horaFin, estado } = cita;
  const cancelled = estado === "cancelada";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "group flex w-full items-center gap-3 rounded-2xl border border-line bg-white text-left transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.985] hover:shadow-soft",
        compact ? "p-3" : "p-3.5"
      )}
    >
      <span className={clsx("h-9 w-1 shrink-0 rounded-full", cancelled ? "bg-line-strong" : DOT[tratamiento?.color] || "bg-sage-500")} />
      <div className={clsx("flex flex-col items-start", compact ? "min-w-[44px]" : "min-w-[64px]")}>
        <span className={clsx("text-[14.5px] font-semibold tabular-nums", cancelled ? "text-ink-faint line-through" : "text-ink")}>
          {horaInicio}
        </span>
        {!compact && (
          <span className="flex items-center gap-1 text-[11.5px] text-ink-faint">
            <Clock size={11} strokeWidth={2} />
            {cita.duracionMin} min
          </span>
        )}
      </div>
      <Avatar name={patientFullName(paciente)} size="sm" />
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-[14.5px] font-medium", cancelled ? "text-ink-faint" : "text-ink")}>
          {patientFullName(paciente)}
        </p>
        {!compact && (
          <p className="truncate text-[12.5px] text-ink-muted">{tratamiento?.nombre}</p>
        )}
      </div>
      {compact ? (
        <span
          className={clsx(
            "h-2 w-2 shrink-0 rounded-full",
            estado === "cancelada" ? "bg-line-strong" : estado === "pendiente" ? "bg-amber-500" : estado === "completada" ? "bg-ink-faint" : "bg-sage-500"
          )}
        />
      ) : (
        <StatusBadge status={estado} className="shrink-0" />
      )}
    </button>
  );
}
