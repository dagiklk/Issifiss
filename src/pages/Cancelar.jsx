import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { XCircle, CalendarClock, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Card from "../components/admin/ui/Card.jsx";
import Button from "../components/admin/ui/Button.jsx";
import StatusBadge from "../components/admin/ui/StatusBadge.jsx";
import SelectorHorario from "../components/SelectorHorario.jsx";
import { zonedTimeToUtc } from "../utils/dateHelpers.js";

// "citas" no es legible/editable por visitantes anónimos (RLS, ver
// supabase/schema.sql): la búsqueda, cancelación y reprogramación por token
// pasan por estas Edge Functions, que usan la Service Role Key en el servidor.
const CANCELAR_CITA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancelar-cita`;
const REPROGRAMAR_CITA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reprogramar-cita`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mismo helper que Reservar.jsx (duplicado a propósito: cada página pública
// arma su propia tira de días, no hay un componente compartido para esto).
function proximosDias(cantidad = 21) {
  const dias = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }
  return dias;
}

export default function Cancelar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);

  const [reprogramando, setReprogramando] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [enviandoReprogramacion, setEnviandoReprogramacion] = useState(false);
  const [reprogramada, setReprogramada] = useState(false);

  useEffect(() => {
    async function buscarCita() {
      if (!token) {
        setError("Enlace no válido: falta el token de la cita.");
        setCargando(false);
        return;
      }

      try {
        const respuesta = await fetch(`${CANCELAR_CITA_URL}?token=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${ANON_KEY}` },
        });
        const data = await respuesta.json();

        if (!respuesta.ok) {
          setError(data.error || "No se ha encontrado ninguna cita con ese enlace.");
        } else {
          setCita(data.cita);
        }
      } catch {
        setError("No se ha podido comprobar la cita. Inténtalo de nuevo.");
      }
      setCargando(false);
    }

    buscarCita();
  }, [token]);

  async function cancelarCita() {
    setCancelando(true);
    try {
      const respuesta = await fetch(CANCELAR_CITA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error || "No se pudo cancelar la cita. Inténtalo de nuevo o contacta directamente.");
      } else {
        setCancelada(true);
      }
    } catch {
      setError("No se pudo cancelar la cita. Inténtalo de nuevo o contacta directamente.");
    } finally {
      setCancelando(false);
    }
  }

  function abrirReprogramacion() {
    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
    setReprogramada(false);
    setError(null);
    setReprogramando(true);
  }

  async function confirmarReprogramacion() {
    if (!diaSeleccionado || !horaSeleccionada) return;
    setEnviandoReprogramacion(true);
    setError(null);
    try {
      const y = diaSeleccionado.getFullYear();
      const m = String(diaSeleccionado.getMonth() + 1).padStart(2, "0");
      const d = String(diaSeleccionado.getDate()).padStart(2, "0");
      const fechaHoraInicio = zonedTimeToUtc(`${y}-${m}-${d}`, horaSeleccionada).toISOString();

      const respuesta = await fetch(REPROGRAMAR_CITA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ token, fecha_hora_inicio: fechaHoraInicio }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error || "No se pudo cambiar la fecha/hora. Inténtalo de nuevo o contacta directamente.");
      } else {
        setCita(data.cita);
        setReprogramando(false);
        setReprogramada(true);
      }
    } catch {
      setError("No se pudo cambiar la fecha/hora. Inténtalo de nuevo o contacta directamente.");
    } finally {
      setEnviandoReprogramacion(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className={clsx("mx-auto px-4 py-8 lg:px-8 lg:py-12", reprogramando ? "max-w-xl" : "max-w-md")}>
        <Card className="p-6 text-center lg:p-8">
          {cargando && <p className="text-[13.5px] text-ink-faint">Buscando tu cita…</p>}

          {!cargando && error && <p className="mb-3 text-[14px] text-rose-600">{error}</p>}

          {!cargando && cita && !cancelada && !reprogramando && (
            <>
              <h1 className="mb-1.5 font-display text-[19px] font-semibold tracking-display text-ink">{cita.servicios?.nombre}</h1>
              <p className="text-[14px] text-ink-muted">
                {new Date(cita.fecha_hora_inicio).toLocaleString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mb-5 mt-3 flex justify-center">
                <StatusBadge status={cita.estado} />
              </div>

              {reprogramada && (
                <p className="mb-4 flex items-center justify-center gap-1.5 text-[13.5px] font-medium text-sage-700">
                  <CheckCircle2 size={16} strokeWidth={2} />
                  Horario actualizado
                </p>
              )}

              {["pendiente", "confirmada"].includes(cita.estado) ? (
                <div className="flex flex-col gap-2.5">
                  <Button variant="secondary" block onClick={abrirReprogramacion}>
                    <CalendarClock size={16} strokeWidth={1.8} className="mr-1.5" />
                    Cambiar fecha u hora
                  </Button>
                  <Button variant="danger" block onClick={cancelarCita} disabled={cancelando}>
                    {cancelando ? "Cancelando…" : "Cancelar esta cita"}
                  </Button>
                </div>
              ) : (
                <p className="text-[13.5px] text-ink-faint">Esta cita ya está cancelada.</p>
              )}
            </>
          )}

          {!cargando && cita && !cancelada && reprogramando && (
            <div className="text-left">
              <h1 className="mb-1 font-display text-[19px] font-semibold tracking-display text-ink">Cambiar fecha u hora</h1>
              <p className="mb-4 text-[13.5px] text-ink-muted">{cita.servicios?.nombre}</p>

              <div className="mb-5">
                <p className="mb-2.5 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Día</p>
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {proximosDias().map((dia) => {
                    const activo = diaSeleccionado && dia.getTime() === diaSeleccionado.getTime();
                    return (
                      <button
                        key={dia.toISOString()}
                        type="button"
                        onClick={() => {
                          setDiaSeleccionado(dia);
                          setHoraSeleccionada(null);
                        }}
                        className={clsx(
                          "flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-2xl py-2.5 transition-all duration-150 ease-out active:scale-95",
                          activo ? "bg-ink text-white shadow-soft" : "border border-line bg-white text-ink hover:border-line-strong"
                        )}
                      >
                        <span className={clsx("text-[10.5px] font-medium uppercase tracking-eyebrow", activo ? "text-white/70" : "text-ink-faint")}>
                          {dia.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "")}
                        </span>
                        <span className="text-[16px] font-semibold tabular-nums">{dia.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {diaSeleccionado && (
                <SelectorHorario
                  fecha={diaSeleccionado}
                  servicio={{ id: cita.servicio_id, duracion_minutos: cita.servicios?.duracion_minutos }}
                  horaSeleccionada={horaSeleccionada}
                  onSelect={setHoraSeleccionada}
                />
              )}

              <div className="mt-5 flex gap-2.5">
                <Button variant="secondary" onClick={() => setReprogramando(false)} disabled={enviandoReprogramacion}>
                  Volver
                </Button>
                <Button
                  variant="accent"
                  block
                  disabled={!diaSeleccionado || !horaSeleccionada || enviandoReprogramacion}
                  onClick={confirmarReprogramacion}
                >
                  {enviandoReprogramacion ? "Guardando…" : "Confirmar nuevo horario"}
                </Button>
              </div>
            </div>
          )}

          {cancelada && (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <XCircle size={28} strokeWidth={2} />
              </span>
              <h1 className="mt-5 font-display text-[19px] font-semibold tracking-display text-ink">Cita cancelada</h1>
              <p className="mt-1.5 text-[14px] text-ink-muted">
                El hueco ha quedado libre. Puedes reservar una nueva cita cuando quieras.
              </p>
            </>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
