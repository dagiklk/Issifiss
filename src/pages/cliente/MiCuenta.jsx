import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import StatusBadge from "../../components/admin/ui/StatusBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { obtenerPacientePropio } from "../../lib/clientePaciente.js";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";
const inputDisabledClass =
  "h-11 w-full rounded-xl border border-line bg-canvas-sunken px-3.5 text-[14px] text-ink-muted";

function CitaRow({ cita, cancelable }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium text-ink">{cita.servicios?.nombre || "Sesión"}</p>
        <p className="text-[12.5px] text-ink-muted">
          {new Date(cita.fecha_hora_inicio).toLocaleString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <StatusBadge status={cita.estado} />
        {cancelable && (
          <Link to={`/cancelar?token=${cita.token_cancelacion}`} className="text-[12.5px] font-medium text-rose-600 underline underline-offset-2">
            Cancelar
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MiCuenta() {
  const { user, logout, updatePassword } = useAuth();
  const [paciente, setPaciente] = useState(null);
  const [form, setForm] = useState({ nombre: "", telefono: "" });
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });
  const [errorPassword, setErrorPassword] = useState(null);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    let active = true;
    async function cargar() {
      try {
        const propio = await obtenerPacientePropio(user);
        if (!active || !propio) return;
        setPaciente(propio);
        setForm({ nombre: propio.nombre || "", telefono: propio.telefono || "" });

        const { data } = await supabase
          .from("citas")
          .select("id, fecha_hora_inicio, estado, token_cancelacion, servicios(nombre)")
          .eq("paciente_id", propio.id)
          .order("fecha_hora_inicio", { ascending: false });
        if (!active) return;
        setCitas(data || []);
      } catch (err) {
        if (active) setErrorCarga(err.message || "No se pudieron cargar tus datos");
      } finally {
        if (active) setCargando(false);
      }
    }
    cargar();
    return () => {
      active = false;
    };
  }, [user]);

  async function guardarPerfil(e) {
    e.preventDefault();
    if (!paciente) return;
    setGuardando(true);
    try {
      const { error } = await supabase
        .from("pacientes")
        .update({
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
        })
        .eq("id", paciente.id);
      if (error) throw error;
      toast.success("Datos actualizados");
    } catch (err) {
      toast.error(err.message || "No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    setErrorPassword(null);

    if (!passwords.actual) {
      setErrorPassword("Introduce tu contraseña actual");
      return;
    }
    if (!passwords.nueva || passwords.nueva.length < 6) {
      setErrorPassword("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setErrorPassword("Las contraseñas no coinciden");
      return;
    }

    setCambiandoPassword(true);
    try {
      // Reautenticamos con la contraseña actual antes de cambiarla: una
      // sesión abierta (móvil compartido, sesión olvidada en un ordenador
      // público...) no debería bastar por sí sola para tomar la cuenta
      // cambiando la contraseña sin volver a demostrar que la conoces.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.actual,
      });
      if (reauthError) {
        setErrorPassword("La contraseña actual no es correcta");
        return;
      }

      await updatePassword(passwords.nueva);
      setPasswords({ actual: "", nueva: "", confirmar: "" });
      toast.success("Contraseña actualizada");
    } catch (err) {
      setErrorPassword(err.message || "No se pudo actualizar la contraseña");
    } finally {
      setCambiandoPassword(false);
    }
  }

  const ahora = Date.now();
  const proximas = citas.filter((c) => c.estado !== "cancelada" && new Date(c.fecha_hora_inicio).getTime() >= ahora);
  const pasadas = citas.filter((c) => !proximas.includes(c));

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 lg:px-8 lg:py-12">
        <div>
          <h1 className="font-display text-[20px] font-semibold tracking-display text-ink">Mi cuenta</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">Tus datos y tu historial de citas.</p>
        </div>

        {cargando ? (
          <p className="text-[13.5px] text-ink-faint">Cargando…</p>
        ) : errorCarga ? (
          <p className="text-[13.5px] text-rose-600">{errorCarga}</p>
        ) : (
          <>
            <Card className="p-5">
              <p className="mb-4 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Tus datos</p>
              <form onSubmit={guardarPerfil} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Nombre completo</label>
                  <input
                    className={inputClass}
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Email</label>
                    <input className={inputDisabledClass} type="email" value={user?.email || ""} disabled readOnly />
                    <p className="mt-1.5 text-[12px] text-ink-faint">El email no se puede cambiar aquí.</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Teléfono</label>
                    <input
                      className={inputClass}
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" variant="secondary" disabled={guardando} className="self-start">
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <p className="mb-4 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Cambiar contraseña</p>
              <form onSubmit={cambiarPassword} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Contraseña actual</label>
                  <input
                    className={inputClass}
                    type="password"
                    value={passwords.actual}
                    onChange={(e) => setPasswords((p) => ({ ...p, actual: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Nueva contraseña</label>
                    <input
                      className={inputClass}
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={passwords.nueva}
                      onChange={(e) => setPasswords((p) => ({ ...p, nueva: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Confirmar contraseña</label>
                    <input
                      className={inputClass}
                      type="password"
                      value={passwords.confirmar}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirmar: e.target.value }))}
                    />
                  </div>
                </div>
                {errorPassword && <p className="text-[12.5px] text-rose-600">{errorPassword}</p>}
                <Button type="submit" variant="secondary" disabled={cambiandoPassword} className="self-start">
                  {cambiandoPassword ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </form>
            </Card>

            <div>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <p className="text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Próximas citas</p>
                <Button as={Link} to="/reservar" variant="accent" size="sm">
                  Reservar cita
                </Button>
              </div>
              <Card className="overflow-hidden p-0">
                {proximas.length === 0 ? (
                  <p className="px-4 py-4 text-[13.5px] text-ink-faint">No tienes citas próximas.</p>
                ) : (
                  proximas.map((c) => <CitaRow key={c.id} cita={c} cancelable={c.estado !== "cancelada"} />)
                )}
              </Card>
            </div>

            {pasadas.length > 0 && (
              <div>
                <p className="mb-2.5 px-1 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Historial</p>
                <Card className="overflow-hidden p-0">
                  {pasadas.map((c) => (
                    <CitaRow key={c.id} cita={c} cancelable={false} />
                  ))}
                </Card>
              </div>
            )}

            <Button variant="danger" block onClick={logout}>
              <LogOut size={16} strokeWidth={2} className="-ml-1" />
              Cerrar sesión
            </Button>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
