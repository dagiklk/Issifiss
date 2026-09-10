import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

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
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card-issi p-4 p-md-5 text-center">
              {cargando && <p style={{ color: "var(--text-2)" }}>Buscando tu cita...</p>}

              {!cargando && error && <p className="text-error">{error}</p>}

              {!cargando && cita && !cancelada && (
                <>
                  <h5 className="mb-2">{cita.servicios?.nombre}</h5>
                  <p style={{ color: "var(--text-2)" }}>
                    {new Date(cita.fecha_hora_inicio).toLocaleString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className={`badge-estado ${cita.estado} d-inline-block mb-4`}>
                    {cita.estado}
                  </span>

                  {cita.estado !== "cancelada" ? (
                    <button
                      className="btn btn-outline-issi w-100"
                      onClick={cancelarCita}
                      disabled={cancelando}
                    >
                      {cancelando ? "Cancelando..." : "Cancelar esta cita"}
                    </button>
                  ) : (
                    <p style={{ color: "var(--text-3)" }}>Esta cita ya está cancelada.</p>
                  )}
                </>
              )}

              {cancelada && (
                <>
                  <div className="confirm-icon">
                    <i className="bi bi-x-lg"></i>
                  </div>
                  <h5>Cita cancelada</h5>
                  <p style={{ color: "var(--text-2)" }}>
                    El hueco ha quedado libre. Puedes reservar una nueva cita cuando quieras.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
