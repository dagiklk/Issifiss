import { useEffect, useRef } from "react";
import clsx from "clsx";
import { addDays, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { toISODate, formatWeekdayShort } from "../../../utils/dateHelpers.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";

export default function DateStrip({ selected, onSelect, daysBefore = 10, daysAfter = 20 }) {
  const activeRef = useRef(null);
  const { citas } = useAppointments();
  const selectedDate = parseISO(selected);

  const start = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), -daysBefore);
  const days = Array.from({ length: daysBefore + daysAfter }, (_, i) => addDays(start, i));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1 lg:px-8">
      {days.map((day) => {
        const iso = toISODate(day);
        const active = isSameDay(day, selectedDate);
        const hasCitas = citas.some((c) => c.fecha === iso && c.estado !== "cancelada");
        return (
          <button
            key={iso}
            ref={active ? activeRef : null}
            onClick={() => onSelect(iso)}
            className={clsx(
              "flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-2xl py-2.5 transition-all duration-150 ease-out active:scale-95",
              active ? "bg-ink text-white shadow-soft" : "bg-white text-ink border border-line hover:border-line-strong"
            )}
          >
            <span className={clsx("text-[10.5px] font-medium uppercase tracking-eyebrow", active ? "text-white/70" : "text-ink-faint")}>
              {formatWeekdayShort(day)}
            </span>
            <span className={clsx("text-[16px] font-semibold tabular-nums", isToday(day) && !active && "text-sage-600")}>
              {day.getDate()}
            </span>
            <span className={clsx("h-1 w-1 rounded-full", hasCitas ? (active ? "bg-white" : "bg-sage-500") : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}
