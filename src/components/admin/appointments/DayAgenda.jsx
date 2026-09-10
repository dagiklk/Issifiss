import { Plus, CalendarX } from "lucide-react";
import AppointmentCard from "./AppointmentCard.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";

export default function DayAgenda({ fecha, onOpenCita, onNewAt, isToday, nowHHmm }) {
  const { getByFecha, slotsForDate } = useAppointments();
  const slots = slotsForDate(fecha, 30);
  const byHora = new Map(getByFecha(fecha).filter((c) => c.estado !== "cancelada").map((c) => [c.horaInicio, c]));

  if (slots.length === 0) {
    return (
      <EmptyState icon={CalendarX} title="Clínica cerrada" description="No hay horario de atención configurado para este día." />
    );
  }

  const rows = slots.map((hora) => ({ kind: "slot", hora }));
  if (isToday && nowHHmm >= slots[0] && nowHHmm <= slots[slots.length - 1]) {
    let idx = rows.findIndex((r) => r.hora > nowHHmm);
    if (idx === -1) idx = rows.length;
    rows.splice(idx, 0, { kind: "now" });
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-6 lg:px-8">
      {rows.map((row) =>
        row.kind === "now" ? (
          <div key="now" className="flex items-center gap-2 px-1 py-0.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
            <span className="text-[11px] font-semibold tabular-nums text-rose-500">{nowHHmm}</span>
            <span className="h-px flex-1 bg-rose-200" />
          </div>
        ) : byHora.has(row.hora) ? (
          <AppointmentCard key={row.hora} cita={byHora.get(row.hora)} onClick={() => onOpenCita(byHora.get(row.hora))} />
        ) : (
          <button
            key={row.hora}
            onClick={() => onNewAt(fecha, row.hora)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-transparent p-3.5 text-left transition-colors duration-150 hover:border-sage-300 hover:bg-sage-50/40 active:scale-[0.985]"
          >
            <span className="min-w-[64px] text-[14.5px] font-semibold tabular-nums text-ink-faint">{row.hora}</span>
            <span className="flex flex-1 items-center gap-1.5 text-[13px] text-ink-faint group-hover:text-sage-700">
              <Plus size={14} strokeWidth={2.2} />
              Disponible
            </span>
          </button>
        )
      )}
    </div>
  );
}
