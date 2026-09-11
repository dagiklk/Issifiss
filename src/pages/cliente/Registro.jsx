import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { obtenerPacientePropio } from "../../lib/clientePaciente.js";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function ClienteRegistro() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [consentimiento, setConsentimiento] = useState(false);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(false);

  function actualizar(campo, valor) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function validar() {
    const nuevos = {};
    if (!datos.nombre.trim()) nuevos.nombre = "Introduce tu nombre";
    if (!datos.email.trim()) nuevos.email = "Introduce tu email";
    if (!datos.password || datos.password.length < 6) nuevos.password = "La contraseña debe tener al menos 6 caracteres";
    if (!consentimiento) nuevos.consentimiento = "Debes aceptar el tratamiento de tus datos para continuar";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validar()) return;

    setCargando(true);
    try {
      const { session, user } = await signUp(datos.email.trim(), datos.password, {
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
      });

      if (session) {
        await obtenerPacientePropio(user);
        navigate("/cuenta");
      } else {
        setConfirmacionPendiente(true);
      }
    } catch (err) {
      setErrores({ general: err.message || "No se pudo crear la cuenta" });
    } finally {
      setCargando(false);
    }
  }

  if (confirmacionPendiente) {
    return (
      <div className="site-app min-h-dvh bg-canvas">
        <Navbar />
        <div className="mx-auto flex max-w-sm flex-col px-4 py-10 lg:py-16">
          <Card className="p-6 text-center lg:p-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600">
              <CheckCircle2 size={28} strokeWidth={2} />
            </span>
            <h1 className="mt-5 font-display text-[19px] font-semibold tracking-display text-ink">Revisa tu email</h1>
            <p className="mt-1.5 text-[14px] text-ink-muted">
              Te hemos enviado un enlace para confirmar tu cuenta. Después podrás iniciar sesión.
            </p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-sm flex-col px-4 py-10 lg:py-16">
        <Card className="p-6 lg:p-8">
          <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">Crear cuenta</h1>
          <p className="mb-6 mt-1 text-[13.5px] text-ink-muted">
            Guarda tus datos para reservar más rápido la próxima vez.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Nombre completo</label>
              <input
                className={inputClass}
                type="text"
                value={datos.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
                placeholder="Tu nombre y apellidos"
                autoFocus
              />
              {errores.nombre && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.nombre}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Email</label>
              <input
                className={inputClass}
                type="email"
                value={datos.email}
                onChange={(e) => actualizar("email", e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
              {errores.email && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Teléfono (opcional)</label>
              <input
                className={inputClass}
                type="tel"
                value={datos.telefono}
                onChange={(e) => actualizar("telefono", e.target.value)}
                placeholder="600 000 000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Contraseña</label>
              <input
                className={inputClass}
                type="password"
                value={datos.password}
                onChange={(e) => actualizar("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              {errores.password && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.password}</p>}
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-sage-600"
                  checked={consentimiento}
                  onChange={(e) => setConsentimiento(e.target.checked)}
                />
                <span className="text-[13px] leading-relaxed text-ink-muted">
                  Acepto el tratamiento de mis datos personales y de salud según la{" "}
                  <a href="/privacidad" className="font-medium text-sage-700 underline underline-offset-2">
                    política de privacidad
                  </a>
                  .
                </span>
              </label>
              {errores.consentimiento && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.consentimiento}</p>}
            </div>

            {errores.general && <p className="text-[12.5px] text-rose-600">{errores.general}</p>}

            <Button type="submit" variant="accent" block disabled={cargando} className="mt-1">
              {cargando ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-ink-muted">
            ¿Ya tienes cuenta?{" "}
            <Link to="/cuenta/login" className="font-medium text-sage-700 underline underline-offset-2">
              Inicia sesión
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
