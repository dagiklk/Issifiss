import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { CalendarCheck2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext.jsx";
import { obtenerPacientePropio } from "../lib/clientePaciente.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import SelectorHorario from "../components/SelectorHorario.jsx";
import FormularioPaciente from "../components/FormularioPaciente.jsx";
import Button from "../components/admin/ui/Button.jsx";
import Card from "../components/admin/ui/Card.jsx";
import Stepper from "../components/admin/ui/Stepper.jsx";

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-cita`;
const STEPS = ["Tratamiento", "Horario", "Tus datos", "Confirmación"];

function proximosDias(cantidad = 21) {
  const dias = [];
  const hoy = new Date();
  // Normalizamos a medianoche: si no, "hoy" lleva la hora exacta actual y,
  // como esta función se vuelve a ejecutar en cada render, cada día generado
  // tendría un timestamp distinto en cada pasada. Eso rompe la tira de días
  // controlada de más abajo: su selección (guardada en el render anterior)
  // deja de coincidir con ningún día nuevo y salta de vuelta al primero.
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }
  return dias;
}

export default function Reservar() {
  const { session, isAdmin, signUp, login } = useAuth();
  const clienteLogueado = Boolean(session) && !isAdmin;
  const location = useLocation();
  const servicioIdPreseleccionado = location.state?.servicioId ?? null;

  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [datosPaciente, setDatosPaciente] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorReserva, setErrorReserva] = useState(null);
  const [citaConfirmada, setCitaConfirmada] = useState(null);
  const [cuentaPendienteConfirmacion, setCuentaPendienteConfirmacion] = useState(false);

  // Login opcional dentro del propio paso "Tus datos": un cliente que ya
  // tiene cuenta pero no había iniciado sesión podía, sin darse cuenta,
  // reservar como invitado y acabar con una ficha de paciente duplicada sin
  // enlazar a su cuenta (el matching de invitados solo busca entre pacientes
  // sin cuenta, ver crear-cita). Iniciar sesión aquí evita ese duplicado.
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginCargando, setLoginCargando] = useState(false);

  useEffect(() => {
    async function cargarServicios() {
      const { data } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      const lista = data ?? [];
      setServicios(lista);

      // El servicio elegido en la landing (Home) viaja como state de router;
      // lo preseleccionamos aquí para no obligar a elegirlo otra vez.
      if (servicioIdPreseleccionado) {
        const encontrado = lista.find((s) => s.id === servicioIdPreseleccionado);
        if (encontrado) setServicioSeleccionado(encontrado);
      }
    }
    cargarServicios();
  }, [servicioIdPreseleccionado]);

  // Cliente con cuenta: precargamos sus datos para que no tenga que
  // rellenarlos de nuevo en el paso "Tus datos".
  useEffect(() => {
    if (!clienteLogueado) return;
    let active = true;
    obtenerPacientePropio(session.user).then((propio) => {
      if (!active || !propio) return;
      setDatosPaciente((prev) => ({
        ...prev,
        nombre: prev.nombre || propio.nombre || "",
        email: prev.email || propio.email || "",
        telefono: prev.telefono || propio.telefono || "",
        // No preseleccionamos el consentimiento aunque el cliente ya tenga
        // cuenta: bajo RGPD el consentimiento debe darse de forma expresa
        // para cada tratamiento, una casilla premarcada no cuenta como
        // consentimiento válido. (Antes esto era "prev.consentimientoRGPD ||
        // true", que la forzaba a true siempre por error.)
        consentimientoRGPD: prev.consentimientoRGPD || false,
      }));
    });
    return () => {
      active = false;
    };
  }, [clienteLogueado, session]);

  async function handleLoginInline(e) {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Introduce tu email y contraseña");
      return;
    }
    setLoginCargando(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      // Al iniciar sesión, "clienteLogueado" pasa a true y el efecto de más
      // arriba precarga sus datos; este bloque deja de renderizarse solo.
    } catch {
      setLoginError("Email o contraseña incorrectos");
    } finally {
      setLoginCargando(false);
    }
  }

  async function confirmarReserva() {
    setEnviando(true);
    setErrorReserva(null);

    const fechaHoraInicio = new Date(fechaSeleccionada);
    const [h, m] = horaSeleccionada.split(":").map(Number);
    fechaHoraInicio.setHours(h, m, 0, 0);

    let accessToken = clienteLogueado ? session.access_token : null;
    let cuentaPendiente = false;

    // Invitado que ha puesto contraseña: le creamos la cuenta en el mismo
    // paso, así la reserva ya queda ligada a ella y no tiene que volver a
    // rellenar sus datos la próxima vez. Si falla (p.ej. ya tenía cuenta con
    // ese email), no bloqueamos la reserva: seguimos como invitado.
    if (!clienteLogueado && datosPaciente.password) {
      try {
        const { session: nuevaSesion } = await signUp(datosPaciente.email.trim(), datosPaciente.password, {
          nombre: datosPaciente.nombre?.trim(),
          telefono: datosPaciente.telefono?.trim() || "",
        });
        if (nuevaSesion) {
          accessToken = nuevaSesion.access_token;
        } else {
          cuentaPendiente = true;
        }
      } catch (err) {
        console.error("No se pudo crear la cuenta, se reserva como invitado:", err);
      }
    }

    try {
      const respuesta = await fetch(SUPABASE_FUNCTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
      setCuentaPendienteConfirmacion(cuentaPendiente);
      setPaso(3);
    } catch (err) {
      setErrorReserva(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 lg:py-12">
        <Card className="overflow-hidden pt-5 lg:pt-6">
          {paso < 3 && <Stepper steps={STEPS} current={paso} />}

          <div className="px-4 pb-6 lg:px-8">
            {/* Paso 0: servicio */}
            {paso === 0 && (
              <>
                <h1 className="mb-4 font-display text-[20px] font-semibold tracking-display text-ink">Elige tu sesión</h1>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {servicios.map((servicio) => (
                    <ServicioCard
                      key={servicio.id}
                      servicio={servicio}
                      seleccionado={servicioSeleccionado?.id === servicio.id}
                      onSelect={setServicioSeleccionado}
                    />
                  ))}
                  {servicios.length === 0 && (
                    <p className="col-span-full py-6 text-center text-[13.5px] text-ink-faint">
                      Todavía no hay servicios configurados.
                    </p>
                  )}
                </div>
                <Button variant="accent" block disabled={!servicioSeleccionado} onClick={() => setPaso(1)} className="mt-5">
                  Continuar
                </Button>
              </>
            )}

            {/* Paso 1: horario */}
            {paso === 1 && (
              <>
                <h1 className="mb-4 font-display text-[20px] font-semibold tracking-display text-ink">Elige un horario</h1>

                <div className="mb-5">
                  <p className="mb-2.5 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Día</p>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {proximosDias().map((dia) => {
                      const activo = fechaSeleccionada && dia.getTime() === fechaSeleccionada.getTime();
                      return (
                        <button
                          key={dia.toISOString()}
                          type="button"
                          onClick={() => {
                            setFechaSeleccionada(dia);
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

                {fechaSeleccionada && (
                  <SelectorHorario
                    fecha={fechaSeleccionada}
                    servicio={servicioSeleccionado}
                    horaSeleccionada={horaSeleccionada}
                    onSelect={setHoraSeleccionada}
                  />
                )}

                <div className="mt-5 flex gap-2.5">
                  <Button variant="secondary" onClick={() => setPaso(0)}>
                    Atrás
                  </Button>
                  <Button variant="accent" block disabled={!horaSeleccionada} onClick={() => setPaso(2)}>
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {/* Paso 2: datos del paciente */}
            {paso === 2 && (
              <>
                <h1 className="mb-4 font-display text-[20px] font-semibold tracking-display text-ink">Tus datos</h1>
                {clienteLogueado && datosPaciente.nombre && (
                  <p className="mb-4 rounded-xl bg-sage-50 px-3.5 py-2.5 text-[13px] text-sage-700">
                    Reservando como <strong>{datosPaciente.nombre}</strong>. Puedes corregir cualquier dato si hace falta.
                  </p>
                )}

                {!clienteLogueado && (
                  <div className="mb-4 rounded-xl border border-line bg-canvas-sunken/60 p-3.5">
                    {!mostrarLogin ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] text-ink-soft">¿Ya tienes cuenta con nosotros?</p>
                        <button
                          type="button"
                          onClick={() => setMostrarLogin(true)}
                          className="text-[13px] font-medium text-sage-700 underline underline-offset-2"
                        >
                          Inicia sesión para reservar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleLoginInline} className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium text-ink">Inicia sesión</p>
                          <button
                            type="button"
                            onClick={() => setMostrarLogin(false)}
                            className="text-[12.5px] text-ink-faint underline underline-offset-2"
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <input
                            type="email"
                            autoFocus
                            placeholder="tucorreo@ejemplo.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none"
                          />
                          <input
                            type="password"
                            placeholder="Contraseña"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none"
                          />
                        </div>
                        {loginError && <p className="text-[12.5px] text-rose-600">{loginError}</p>}
                        <Button type="submit" variant="accent" size="sm" disabled={loginCargando}>
                          {loginCargando ? "Entrando…" : "Entrar"}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                <FormularioPaciente
                  datos={datosPaciente}
                  onChange={setDatosPaciente}
                  onSubmit={confirmarReserva}
                  enviando={enviando}
                  pedirPassword={!clienteLogueado}
                />
                {errorReserva && <p className="mt-3 text-[13px] text-rose-600">{errorReserva}</p>}
                <Button variant="secondary" block onClick={() => setPaso(1)} disabled={enviando} className="mt-3">
                  Atrás
                </Button>
              </>
            )}

            {/* Paso 3: confirmación */}
            {paso === 3 && citaConfirmada && (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <CalendarCheck2 size={28} strokeWidth={2} />
                </span>
                <h1 className="mt-5 font-display text-[20px] font-semibold tracking-display text-ink">¡Solicitud enviada!</h1>
                <p className="mt-1.5 text-[14px] text-ink-muted">
                  {servicioSeleccionado.nombre} ·{" "}
                  {fechaSeleccionada.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                  {horaSeleccionada}
                </p>
                <div className="my-5 h-px w-full bg-line" />
                <p className="text-[13px] text-ink-faint">
                  Tu fisio la revisará y te avisaremos por email en cuanto quede confirmada.
                </p>
                {datosPaciente.email && (
                  <p className="mt-2 text-[13px] text-ink-faint">
                    Te hemos enviado un email con el resumen de tu solicitud y el enlace para cancelarla.
                  </p>
                )}
                {!clienteLogueado && datosPaciente.password && (
                  <p className="mt-2 text-[13px] text-ink-faint">
                    {cuentaPendienteConfirmacion
                      ? "Además, te hemos enviado un email para confirmar tu nueva cuenta: una vez confirmada, podrás iniciar sesión y ver tus citas en Mi cuenta."
                      : "Además, te hemos creado una cuenta con tu email: ya has iniciado sesión y puedes ver tus citas en Mi cuenta."}
                  </p>
                )}
                <p className="mt-2 text-[13px] text-ink-faint">Guarda este enlace por si necesitas cancelar tu cita:</p>
                <a
                  href={`${window.location.origin}/cancelar?token=${citaConfirmada.token_cancelacion}`}
                  className="mt-1.5 break-all text-[13px] font-medium text-sage-700"
                >
                  {window.location.origin}/cancelar?token={citaConfirmada.token_cancelacion}
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
