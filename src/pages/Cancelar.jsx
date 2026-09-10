import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Card from "../components/admin/ui/Card.jsx";
import Button from "../components/admin/ui/Button.jsx";
import StatusBadge from "../components/admin/ui/StatusBadge.jsx";

// "citas" no es legible/editable por visitantes anónimos (RLS, ver
// supabase/schema.sql): la búsqueda y cancelación por token pasa por esta
// Edge Function, que usa la Service Role Key en el servidor.
const CANCELAR_CITA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancelar-cita`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Cancelar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);

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

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-8 lg:px-8 lg:py-12">
        <Card className="p-6 text-center lg:p-8">
          {cargando && <p className="text-[13.5px] text-ink-faint">Buscando tu cita…</p>}

          {!cargando && error && <p className="text-[14px] text-rose-600">{error}</p>}

          {!cargando && cita && !cancelada && (
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

              {cita.estado !== "cancelada" ? (
                <Button variant="danger" block onClick={cancelarCita} disabled={cancelando}>
                  {cancelando ? "Cancelando…" : "Cancelar esta cita"}
                </Button>
              ) : (
                <p className="text-[13.5px] text-ink-faint">Esta cita ya está cancelada.</p>
              )}
            </>
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
