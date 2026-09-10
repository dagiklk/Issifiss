import clsx from "clsx";
import { addDays, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { formatWeekdayShort, toISODate } from "../../../utils/dateHelpers.js";
import { patientFullName } from "../../../lib/clinicData.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";
import Avatar from "../ui/Avatar.jsx";

const DOT = { sage: "bg-sage-500", amber: "bg-amber-500", rose: "bg-rose-500" };

export default function WeekColumns({ selected, onSelectDay, onOpenCita }) {
  const { getByFecha } = useAppointments();
  const selectedDate = parseISO(selected);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-6 lg:grid lg:snap-none lg:grid-cols-7 lg:gap-3 lg:px-8">
      {days.map((day) => {
        const iso = toISODate(day);
        const citas = getByFecha(iso).filter((c) => c.estado !== "cancelada");
        const active = isSameDay(day, selectedDate);
        return (
          <div
            key={iso}
            className="flex w-[78vw] shrink-0 snap-start flex-col rounded-2xl border border-line bg-white p-3 sm:w-[240px] lg:w-auto"
          >
            <button
              onClick={() => onSelectDay(iso)}
              className={clsx(
                "mb-2.5 flex items-center justify-between rounded-xl px-2 py-1.5 text-left transition-colors",
                active && "bg-sage-50"
              )}
            >
              <span>
                <span className="block text-[11px] font-medium uppercase tracking-eyebrow text-ink-faint">
                  {formatWeekdayShort(day)}
                </span>
                <span className={clsx("text-[17px] font-semibold tabular-nums", isToday(day) ? "text-sage-700" : "text-ink")}>
                  {day.getDate()}
                </span>
              </span>
              <span className="text-[11px] font-medium text-ink-faint">{citas.length || ""}</span>
            </button>
            <div className="flex flex-col gap-1.5">
              {citas.length === 0 ? (
                <p className="px-2 py-3 text-center text-[12px] text-ink-faint">Sin citas</p>
              ) : (
                citas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenCita(c)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-canvas-sunken active:scale-[0.98]"
                  >
                    <span className={clsx("h-6 w-0.5 shrink-0 rounded-full", DOT[c.tratamiento?.color] || "bg-sage-500")} />
                    <span className="w-10 shrink-0 text-[11.5px] font-semibold tabular-nums text-ink-soft">{c.horaInicio}</span>
                    <Avatar name={patientFullName(c.paciente)} size="sm" className="h-5 w-5 text-[9px]" />
                    <span className="truncate text-[12px] text-ink-soft">{c.paciente.nombre}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
