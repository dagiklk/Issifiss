import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import SelectorHorario from "../components/SelectorHorario.jsx";
import FormularioPaciente from "../components/FormularioPaciente.jsx";

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-cita`;

function proximosDias(cantidad = 14) {
  const dias = [];
  const hoy = new Date();
  // Normalizamos a medianoche: si no, "hoy" lleva la hora exacta actual y,
  // como esta función se vuelve a ejecutar en cada render, cada día generado
  // tendría un timestamp distinto en cada pasada. Eso rompe el <select>
  // controlado de más abajo: su "value" (guardado en el render anterior) deja
  // de coincidir con cualquier <option> nueva y el navegador cae por defecto
  // a la primera opción, aunque el estado interno sí tenga el día correcto.
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }
  return dias;
}

export default function Reservar() {
  const [paso, setPaso] = useState(1);
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [datosPaciente, setDatosPaciente] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorReserva, setErrorReserva] = useState(null);
  const [citaConfirmada, setCitaConfirmada] = useState(null);

  useEffect(() => {
    async function cargarServicios() {
      const { data } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      setServicios(data ?? []);
    }
    cargarServicios();
  }, []);

  async function confirmarReserva() {
    setEnviando(true);
    setErrorReserva(null);

    const fechaHoraInicio = new Date(fechaSeleccionada);
    const [h, m] = horaSeleccionada.split(":").map(Number);
    fechaHoraInicio.setHours(h, m, 0, 0);

    try {
      const respuesta = await fetch(SUPABASE_FUNCTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          servicio_id: servicioSeleccionado.id,
          fecha_hora_inicio: fechaHoraInicio.toISOString(),
          paciente: {
            nombre: datosPaciente.nombre,
            email: datosPaciente.email,
            telefono: datosPaciente.telefono,
          },
          consentimiento_rgpd: datosPaciente.consentimientoRGPD,
          notas: datosPaciente.notas,
        }),
      });

      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.error || "No se pudo completar la reserva");

      setCitaConfirmada(data.cita);
      setPaso(4);
    } catch (err) {
      setErrorReserva(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="card-issi p-4 p-md-5">
              <div className="stepper">
                <div className={`step-dot ${paso >= 1 ? "active" : ""}`}></div>
                <div className={`step-dot ${paso >= 2 ? "active" : ""}`}></div>
                <div className={`step-dot ${paso >= 3 ? "active" : ""}`}></div>
              </div>

              {/* Paso 1: servicio */}
              {paso === 1 && (
                <>
                  <h5 className="mb-3">Elige tu sesión</h5>
                  <div className="row g-3">
                    {servicios.map((servicio) => (
                      <div className="col-md-6" key={servicio.id}>
                        <ServicioCard
                          servicio={servicio}
                          seleccionado={servicioSeleccionado?.id === servicio.id}
                          onSelect={setServicioSeleccionado}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-accent w-100 mt-4"
                    disabled={!servicioSeleccionado}
                    onClick={() => setPaso(2)}
                  >
                    Continuar
                  </button>
                </>
              )}

              {/* Paso 2: horario */}
              {paso === 2 && (
                <>
                  <h5 className="mb-3">Elige un horario</h5>

                  <div className="mb-3">
                    <label className="form-label-issi">Día</label>
                    <select
                      className="form-select-issi"
                      value={fechaSeleccionada ? fechaSeleccionada.toISOString() : ""}
                      onChange={(e) => {
                        setFechaSeleccionada(new Date(e.target.value));
                        setHoraSeleccionada(null);
                      }}
                    >
                      <option value="" disabled>
                        Selecciona un día
                      </option>
                      {proximosDias().map((dia) => (
                        <option key={dia.toISOString()} value={dia.toISOString()}>
                          {dia.toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fechaSeleccionada && (
                    <SelectorHorario
                      fecha={fechaSeleccionada}
                      servicio={servicioSeleccionado}
                      horaSeleccionada={horaSeleccionada}
                      onSelect={setHoraSeleccionada}
                    />
                  )}

                  <div className="d-flex gap-3 mt-4">
                    <button className="btn btn-outline-issi" onClick={() => setPaso(1)}>
                      Atrás
                    </button>
                    <button
                      className="btn btn-accent flex-grow-1"
                      disabled={!horaSeleccionada}
                      onClick={() => setPaso(3)}
                    >
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* Paso 3: datos del paciente */}
              {paso === 3 && (
                <>
                  <h5 className="mb-3">Tus datos</h5>
                  <FormularioPaciente
                    datos={datosPaciente}
                    onChange={setDatosPaciente}
                    onSubmit={confirmarReserva}
                    enviando={enviando}
                  />
                  {errorReserva && <div className="text-error mt-3">{errorReserva}</div>}
                  <button
                    type="button"
                    className="btn btn-outline-issi w-100 mt-3"
                    onClick={() => setPaso(2)}
                    disabled={enviando}
                  >
                    Atrás
                  </button>
                </>
              )}

              {/* Paso 4: confirmación */}
              {paso === 4 && citaConfirmada && (
                <div className="text-center py-3">
                  <div className="confirm-icon">
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h5>¡Cita reservada!</h5>
                  <p style={{ color: "var(--text-2)" }}>
                    {servicioSeleccionado.nombre} ·{" "}
                    {fechaSeleccionada.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · {horaSeleccionada}
                  </p>
                  <hr className="divider my-3" />
                  {datosPaciente.email && (
                    <p style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
                      Te hemos enviado la confirmación por email con el enlace para cancelar tu
                      cita.
                    </p>
                  )}
                  <p style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
                    Guarda este enlace por si necesitas cancelar tu cita:
                  </p>
                  <a
                    href={`${window.location.origin}/cancelar?token=${citaConfirmada.token_cancelacion}`}
                    style={{ color: "var(--accent)", wordBreak: "break-all", fontSize: "0.85rem" }}
                  >
                    {window.location.origin}/cancelar?token={citaConfirmada.token_cancelacion}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
