import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import logo from "../../assets/logo.png";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function Login() {
  const { login, session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [intentado, setIntentado] = useState(false);

  // Navegar solo cuando el contexto confirma sesión + admin, en vez de
  // justo después de que login() resuelva: signInWithPassword() puede
  // devolver antes de que el listener de Supabase actualice la sesión (y
  // antes de que se compruebe el rol de admin), así que navegar de forma
  // inmediata a veces caía en /admin/panel con la sesión todavía sin
  // propagar y ProtectedRoute te devolvía al login — de ahí que hubiera que
  // meter usuario y contraseña dos veces.
  useEffect(() => {
    if (loading) return;
    if (session && isAdmin) {
      navigate("/admin/panel", { replace: true });
    } else if (intentado && session && !isAdmin) {
      setError("Esta cuenta no tiene acceso al panel de administración.");
      setCargando(false);
    }
  }, [loading, session, isAdmin, intentado, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Introduce tu email y contraseña");
      return;
    }

    setCargando(true);
    setIntentado(true);
    try {
      await login(email, password);
      // La redirección la dispara el efecto de arriba en cuanto el
      // contexto confirma sesión + admin.
    } catch (err) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
    }
  }

  return (
    <div className="site-app flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <Card className="p-6 lg:p-8">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="issifiss" className="h-9 w-9 object-contain" />
            <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">
              issi<span className="text-sage-600">fiss</span>
            </h1>
          </div>
          <p className="mb-6 mt-3 text-[13.5px] text-ink-muted">Acceso para el equipo</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Email</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Contraseña</label>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
            <Button type="submit" variant="accent" block disabled={cargando} className="mt-1">
              {cargando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
