import { useEffect, useState } from "react";
import clsx from "clsx";
import { supabase } from "../lib/supabaseClient";

// Genera los slots de "hora_inicio" a "hora_fin" en intervalos de "duracionMin"
function generarSlots(horaInicio, horaFin, duracionMin) {
  const slots = [];
  const [hIni, mIni] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);

  let cursor = hIni * 60 + mIni;
  const fin = hFin * 60 + mFin;

  while (cursor + duracionMin <= fin) {
    const h = String(Math.floor(cursor / 60)).padStart(2, "0");
    const m = String(cursor % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    cursor += duracionMin;
  }
  return slots;
}

/**
 * Props:
 *  - fecha: objeto Date del día elegido
 *  - servicio: { id, duracion_minutos }
 *  - horaSeleccionada: string "HH:MM" | null
 *  - onSelect: (horaStr) => void
 */
export default function SelectorHorario({ fecha, servicio, horaSeleccionada, onSelect }) {
  const [slots, setSlots] = useState([]);
  const [ocupados, setOcupados] = useState(new Set());
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!fecha || !servicio) return;

    async function cargarDisponibilidad() {
      setCargando(true);
      const diaSemana = fecha.getDay(); // 0=domingo ... 6=sábado

      // 1. Franjas de disponibilidad configuradas para ese día de la semana
      const { data: franjas } = await supabase
        .from("disponibilidad")
        .select("hora_inicio, hora_fin")
        .eq("dia_semana", diaSemana)
        .eq("activo", true);

      const todosLosSlots = (franjas ?? []).flatMap((f) =>
        generarSlots(f.hora_inicio.slice(0, 5), f.hora_fin.slice(0, 5), servicio.duracion_minutos)
      );

      // 2. Citas activas ya existentes ese día, para marcar huecos ocupados
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);

      // "citas" no es legible por visitantes anónimos (RLS); usamos la vista
      // pública "franjas_ocupadas", que solo expone fecha/hora de las citas activas.
      const { data: citas } = await supabase
        .from("franjas_ocupadas")
        .select("fecha_hora_inicio")
        .gte("fecha_hora_inicio", inicioDia.toISOString())
        .lte("fecha_hora_inicio", finDia.toISOString());

      const horasOcupadas = new Set(
        (citas ?? []).map((c) => {
          const d = new Date(c.fecha_hora_inicio);
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        })
      );

      setSlots(todosLosSlots);
      setOcupados(horasOcupadas);
      setCargando(false);
    }

    cargarDisponibilidad();
  }, [fecha, servicio]);

  if (cargando) {
    return <p className="py-4 text-center text-[13.5px] text-ink-faint">Buscando horarios disponibles…</p>;
  }

  if (slots.length === 0) {
    return <p className="py-4 text-center text-[13.5px] text-ink-faint">No hay horarios disponibles ese día.</p>;
  }

  const morning = slots.filter((h) => h < "14:00");
  const afternoon = slots.filter((h) => h >= "14:00");

  const Group = ({ title, items }) =>
    items.length > 0 && (
      <div className="mb-4">
        <p className="mb-2.5 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">{title}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {items.map((hora) => {
            const ocupado = ocupados.has(hora);
            const seleccionado = horaSeleccionada === hora;
            return (
              <button
                key={hora}
                type="button"
                disabled={ocupado}
                onClick={() => onSelect(hora)}
                className={clsx(
                  "h-11 rounded-xl text-[13.5px] font-medium tabular-nums transition-all duration-150 ease-out active:scale-95",
                  ocupado && "cursor-not-allowed bg-canvas-sunken text-ink-faint line-through",
                  !ocupado && seleccionado && "bg-ink text-white shadow-soft",
                  !ocupado && !seleccionado && "border border-line bg-white text-ink hover:border-sage-300 hover:bg-sage-50/50"
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
