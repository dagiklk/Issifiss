import clsx from "clsx";
import { addDays, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { formatWeekdayShort, toISODate } from "../../../utils/dateHelpers.js";
import { patientFullName } from "../../../lib/clinicData.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";
import Avatar from "../ui/Avatar.jsx";

const DOT = { sage: "bg-sage-500", amber: "bg-amber-500", rose: "bg-rose-500" };
// En móvil no hay ancho para listar las citas de los 7 días a la vez, así que
// cada día se resume con puntos de color (uno por cita) en vez del listado
// completo — eso es lo que permite que la semana entera quepa en una sola
// fila, sin scroll horizontal. Tocar un día lleva a la vista "Día" (ver
// onSelectDay en Agenda.jsx), que sí muestra el listado completo.
const MAX_PUNTOS_MOVIL = 4;

export default function WeekColumns({ selected, onSelectDay, onOpenCita }) {
  const { getByFecha } = useAppointments();
  const selectedDate = parseISO(selected);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      {/* Móvil/tablet: resumen compacto de la semana entera en una sola fila,
          sin deslizar. */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-6 sm:gap-1.5 sm:px-4 lg:hidden">
        {days.map((day) => {
          const iso = toISODate(day);
          const citas = getByFecha(iso).filter((c) => c.estado !== "cancelada");
          const active = isSameDay(day, selectedDate);
          const puntos = citas.slice(0, MAX_PUNTOS_MOVIL);
          const restantes = citas.length - puntos.length;

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={clsx(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl border border-line bg-white py-2 transition-colors active:scale-[0.97]",
                active && "border-sage-300 bg-sage-50"
              )}
            >
              <span className="text-[9px] font-medium uppercase tracking-eyebrow text-ink-faint">
                {formatWeekdayShort(day).slice(0, 2)}
              </span>
              <span className={clsx("text-[14px] font-semibold tabular-nums", isToday(day) ? "text-sage-700" : "text-ink")}>
                {day.getDate()}
              </span>
              <span className="flex h-3 flex-wrap items-center justify-center gap-0.5 px-0.5">
                {puntos.map((c) => (
                  <span key={c.id} className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", DOT[c.tratamiento?.color] || "bg-sage-500")} />
                ))}
                {restantes > 0 && <span className="text-[8px] font-medium leading-none text-ink-faint">+{restantes}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Escritorio: columnas con el listado completo de citas. */}
      <div className="hidden gap-3 px-8 pb-6 lg:grid lg:grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day);
          const citas = getByFecha(iso).filter((c) => c.estado !== "cancelada");
          const active = isSameDay(day, selectedDate);
          return (
            <div key={iso} className="flex flex-col rounded-2xl border border-line bg-white p-3">
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
    </>
  );
}
