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
  const { user, logout } = useAuth();
  const [paciente, setPaciente] = useState(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "" });
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  useEffect(() => {
    let active = true;
    async function cargar() {
      try {
        const propio = await obtenerPacientePropio(user);
        if (!active || !propio) return;
        setPaciente(propio);
        setForm({ nombre: propio.nombre || "", telefono: propio.telefono || "", email: propio.email || "" });

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
          email: form.email.trim() || null,
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
                    <input
                      className={inputClass}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
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
