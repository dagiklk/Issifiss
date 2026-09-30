import { useEffect, useState } from "react";
import clsx from "clsx";
import { supabase } from "../lib/supabaseClient";
import { horaEnMadrid, isPastSlot, toISODate, zonedTimeToUtc } from "../utils/dateHelpers.js";
import { minutosDesde, seSolapaConOcupadas } from "../lib/clinicData.js";

// Genera los slots de "hora_inicio" a "hora_fin" en intervalos de "duracionMin".. 
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
  const [ocupados, setOcupados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!fecha || !servicio) return;
    let active = true;

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
      // Límites del día y hora extraída en zona horaria de la clínica
      // (Europe/Madrid), no en la del dispositivo que mira la pantalla: con
      // fecha.setHours() alguien en otro huso horario podía consultar/leer
      // el día equivocado, sobre todo cerca de medianoche en Madrid.
      const fechaISO = toISODate(fecha);
      const inicioDia = zonedTimeToUtc(fechaISO, "00:00");
      const finDia = zonedTimeToUtc(fechaISO, "23:59");

      // "citas" no es legible por visitantes anónimos (RLS); usamos la vista
      // pública "franjas_ocupadas", que expone inicio Y fin de las citas
      // activas. Antes solo se pedía "fecha_hora_inicio" y se marcaba
      // ocupada una hora candidata solo si coincidía EXACTA con el inicio de
      // otra cita — así, una cita de 60 min a las 10:00 no bloqueaba un hueco
      // de 20 min a las 10:20 (que sí cae dentro de esos 60 minutos), y el
      // paciente solo se enteraba del solape al enviar el formulario.
      const { data: citas } = await supabase
        .from("franjas_ocupadas")
        .select("fecha_hora_inicio, fecha_hora_fin")
        .gte("fecha_hora_inicio", inicioDia.toISOString())
        .lte("fecha_hora_inicio", finDia.toISOString());

      const horasOcupadas = (citas ?? []).map((c) => ({
        inicio: minutosDesde(horaEnMadrid(new Date(c.fecha_hora_inicio))),
        fin: minutosDesde(horaEnMadrid(new Date(c.fecha_hora_fin))),
      }));

      if (!active) return;
      setSlots(todosLosSlots);
      setOcupados(horasOcupadas);
      setCargando(false);
    }

    cargarDisponibilidad();
    return () => {
      active = false;
    };
    // Dependencias por valor, no por identidad: "servicio" a veces llega como
    // un objeto literal nuevo en cada render de quien llama (p.ej. Cancelar.jsx
    // al reprogramar), lo que con [fecha, servicio] relanzaba esta consulta
    // en cada tecleo/click aunque el día y el servicio elegidos no cambiaran.
  }, [fecha?.getTime(), servicio?.id, servicio?.duracion_minutos]);

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
            const ocupado = seSolapaConOcupadas(ocupados, hora, servicio.duracion_minutos);
            const pasado = !ocupado && isPastSlot(fecha, hora);
            const seleccionado = horaSeleccionada === hora;
            return (
              <button
                key={hora}
                type="button"
                disabled={ocupado || pasado}
                onClick={() => onSelect(hora)}
                className={clsx(
                  "h-11 rounded-xl text-[13.5px] font-medium tabular-nums transition-all duration-150 ease-out active:scale-95",
                  ocupado && "cursor-not-allowed bg-canvas-sunken text-ink-faint line-through",
                  pasado && "cursor-not-allowed bg-ink/10 text-ink-faint/70",
                  !ocupado && !pasado && seleccionado && "bg-ink text-white shadow-soft",
                  !ocupado && !pasado && !seleccionado && "border border-line bg-white text-ink hover:border-sage-300 hover:bg-sage-50/50"
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
