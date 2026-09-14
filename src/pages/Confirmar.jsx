import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Card from "../components/admin/ui/Card.jsx";
import Button from "../components/admin/ui/Button.jsx";
import StatusBadge from "../components/admin/ui/StatusBadge.jsx";

// "citas" no es legible/editable por visitantes anónimos (RLS, ver
// supabase/schema.sql): la búsqueda y confirmación por token pasan por esta
// Edge Function, que usa la Service Role Key en el servidor — mismo patrón
// que /cancelar con cancelar-cita.
const CONFIRMAR_CITA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirmar-cita`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Confirmar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmada, setConfirmada] = useState(false);

  useEffect(() => {
    async function buscarCita() {
      if (!token) {
        setError("Enlace no válido: falta el token de la cita.");
        setCargando(false);
        return;
      }

      try {
        const respuesta = await fetch(`${CONFIRMAR_CITA_URL}?token=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${ANON_KEY}` },
        });
        const data = await respuesta.json();

        if (!respuesta.ok) {
          setError(data.error || "No se ha encontrado ninguna cita con ese enlace.");
        } else {
          setCita(data.cita);
          if (data.cita.estado === "confirmada") setConfirmada(true);
        }
      } catch {
        setError("No se ha podido comprobar la cita. Inténtalo de nuevo.");
      }
      setCargando(false);
    }

    buscarCita();
  }, [token]);

  async function confirmarCita() {
    setConfirmando(true);
    setError(null);
    try {
      const respuesta = await fetch(CONFIRMAR_CITA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error || "No se pudo confirmar la cita. Inténtalo de nuevo o entra al panel.");
      } else {
        setCita(data.cita);
        setConfirmada(true);
      }
    } catch {
      setError("No se pudo confirmar la cita. Inténtalo de nuevo o entra al panel.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-8 lg:px-8 lg:py-12">
        <Card className="p-6 text-center lg:p-8">
          {cargando && <p className="text-[13.5px] text-ink-faint">Buscando la cita…</p>}

          {!cargando && error && <p className="mb-3 text-[14px] text-rose-600">{error}</p>}

          {!cargando && cita && !confirmada && (
            <>
              <h1 className="mb-1.5 font-display text-[19px] font-semibold tracking-display text-ink">
                {cita.servicios?.nombre}
              </h1>
              <p className="text-[14px] text-ink-muted">{cita.pacientes?.nombre}</p>
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

              {cita.estado === "pendiente" ? (
                <Button variant="accent" block onClick={confirmarCita} disabled={confirmando}>
                  {confirmando ? "Confirmando…" : "Confirmar cita"}
                </Button>
              ) : (
                <p className="text-[13.5px] text-ink-faint">Esta cita ya está cancelada, no se puede confirmar.</p>
              )}
            </>
          )}

          {confirmada && cita && (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                <CheckCircle2 size={28} strokeWidth={2} />
              </span>
              <h1 className="mt-5 font-display text-[19px] font-semibold tracking-display text-ink">Cita confirmada</h1>
              <p className="mt-1.5 text-[14px] text-ink-muted">{cita.servicios?.nombre}</p>
              <p className="text-[14px] text-ink-muted">
                {new Date(cita.fecha_hora_inicio).toLocaleString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {cita.pacientes?.email && (
                <p className="mt-3 text-[13px] text-ink-faint">Se ha avisado al paciente por email.</p>
              )}
            </>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
