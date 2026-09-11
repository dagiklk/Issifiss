import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import Switch from "../ui/Switch.jsx";
import Button from "../ui/Button.jsx";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";
import { DIAS_SEMANA } from "../../../lib/clinicData.js";

// Monday-first, matching how Ajustes.jsx already displayed the read-only list.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const inputClass =
  "h-10 w-full rounded-lg border border-line bg-white px-2.5 text-[13.5px] text-ink focus:border-sage-300 focus:outline-none";

function franjasDeDia(disponibilidad, dow) {
  return disponibilidad
    .filter((f) => f.dia_semana === dow)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    .map((f) => ({ horaInicio: f.hora_inicio.slice(0, 5), horaFin: f.hora_fin.slice(0, 5) }));
}

export default function HorarioEditor() {
  const { disponibilidad, loading, guardarFranjasDia } = useAppointments();
  const [dias, setDias] = useState(null);
  const [guardando, setGuardando] = useState(null);

  // Seed local editable state once the real schedule has loaded. After that,
  // edits live only here until explicitly saved, so saving one day doesn't
  // wipe unsaved edits on another when the realtime refresh comes back.
  useEffect(() => {
    if (dias === null && !loading) {
      setDias(ORDEN_DIAS.map((dow) => ({ dow, franjas: franjasDeDia(disponibilidad, dow) })));
    }
  }, [disponibilidad, loading, dias]);

  if (dias === null) {
    return (
      <Card className="p-4">
        <p className="text-[13.5px] text-ink-faint">Cargando horario…</p>
      </Card>
    );
  }

  function actualizarDia(dow, patch) {
    setDias((prev) => prev.map((d) => (d.dow === dow ? { ...d, ...patch } : d)));
  }

  function toggleAbierto(dow, abierto) {
    actualizarDia(dow, { franjas: abierto ? [{ horaInicio: "09:00", horaFin: "14:00" }] : [] });
  }

  function actualizarFranja(dow, index, campo, valor) {
    setDias((prev) =>
      prev.map((d) =>
        d.dow === dow ? { ...d, franjas: d.franjas.map((f, i) => (i === index ? { ...f, [campo]: valor } : f)) } : d
      )
    );
  }

  function añadirFranja(dow) {
    const dia = dias.find((d) => d.dow === dow);
    actualizarDia(dow, { franjas: [...dia.franjas, { horaInicio: "16:00", horaFin: "20:00" }] });
  }

  function quitarFranja(dow, index) {
    const dia = dias.find((d) => d.dow === dow);
    actualizarDia(dow, { franjas: dia.franjas.filter((_, i) => i !== index) });
  }

  async function guardarDia(dow) {
    const dia = dias.find((d) => d.dow === dow);
    for (const f of dia.franjas) {
      if (!f.horaInicio || !f.horaFin || f.horaFin <= f.horaInicio) {
        toast.error("Revisa las horas: la hora de fin debe ser posterior a la de inicio");
        return;
      }
    }
    setGuardando(dow);
    try {
      await guardarFranjasDia(dow, dia.franjas);
      toast.success("Horario actualizado");
    } catch (err) {
      toast.error(err.message || "No se pudo guardar el horario");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {dias.map((d) => {
        const abierto = d.franjas.length > 0;
        return (
          <Card key={d.dow} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-medium text-ink">{DIAS_SEMANA[d.dow]}</span>
              <Switch checked={abierto} onChange={(v) => toggleAbierto(d.dow, v)} label={`Abierto ${DIAS_SEMANA[d.dow]}`} />
            </div>

            {abierto && (
              <div className="mt-3 flex flex-col gap-2">
                {d.franjas.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      className={inputClass}
                      value={f.horaInicio}
                      onChange={(e) => actualizarFranja(d.dow, i, "horaInicio", e.target.value)}
                    />
                    <span className="text-ink-faint">–</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={f.horaFin}
                      onChange={(e) => actualizarFranja(d.dow, i, "horaFin", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => quitarFranja(d.dow, i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-canvas-sunken hover:text-rose-600"
                      aria-label="Quitar franja"
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => añadirFranja(d.dow)}
                  className="flex items-center gap-1.5 self-start text-[12.5px] font-medium text-sage-700"
                >
                  <Plus size={14} strokeWidth={2} /> Añadir franja
                </button>
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={() => guardarDia(d.dow)} disabled={guardando === d.dow} className="mt-3">
              {guardando === d.dow ? "Guardando…" : "Guardar"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
