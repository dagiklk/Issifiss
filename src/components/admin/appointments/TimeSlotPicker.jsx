import clsx from "clsx";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { CalendarX } from "lucide-react";
import { isPastSlot } from "../../../utils/dateHelpers.js";

export default function TimeSlotPicker({ fecha, duracionMin, value, onChange, excludeCitaId }) {
  const { slotsForDate, horasOcupadas } = useAppointments();
  const slots = slotsForDate(fecha, duracionMin || 30);
  const ocupadas = horasOcupadas(fecha, excludeCitaId);
  const morning = slots.filter((h) => h < "14:00");
  const afternoon = slots.filter((h) => h >= "14:00");

  if (slots.length === 0) {
    return <EmptyState icon={CalendarX} title="Sin horario" description="La clínica no abre este día. Elige otra fecha." />;
  }

  const Group = ({ title, items }) =>
    items.length > 0 && (
      <div className="mb-5">
        <p className="mb-2.5 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">{title}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {items.map((hora) => {
            const taken = ocupadas.has(hora);
            const pasado = !taken && isPastSlot(fecha, hora);
            const active = value === hora;
            return (
              <button
                key={hora}
                disabled={taken || pasado}
                onClick={() => onChange(hora)}
                className={clsx(
                  "h-11 rounded-xl text-[13.5px] font-medium tabular-nums transition-all duration-150 ease-out active:scale-95",
                  taken && "cursor-not-allowed bg-canvas-sunken text-ink-faint line-through",
                  pasado && "cursor-not-allowed bg-ink/10 text-ink-faint/70",
                  !taken && !pasado && active && "bg-ink text-white shadow-soft",
                  !taken && !pasado && !active && "border border-line bg-white text-ink hover:border-sage-300 hover:bg-sage-50/50"
                )}
              >
                {hora}
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div>
      <Group title="Mañana" items={morning} />
      <Group title="Tarde" items={afternoon} />
    </div>
  );
}
