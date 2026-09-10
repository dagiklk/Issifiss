import { useEffect, useState } from "react";
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
    return <p style={{ color: "var(--text-2)" }}>Buscando horarios disponibles...</p>;
  }

  if (slots.length === 0) {
    return <p style={{ color: "var(--text-2)" }}>No hay horarios disponibles ese día.</p>;
  }

  return (
    <div className="row g-2">
      {slots.map((hora) => {
        const ocupado = ocupados.has(hora);
        const seleccionado = horaSeleccionada === hora;
        return (
          <div className="col-4" key={hora}>
            <button
              type="button"
              className={`slot-btn ${seleccionado ? "selected" : ""}`}
              disabled={ocupado}
              onClick={() => onSelect(hora)}
            >
              {hora}
            </button>
          </div>
        );
      })}
    </div>
  );
}
