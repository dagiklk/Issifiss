import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function ClienteLogin() {
  const { login, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Igual que en el login de admin: navegar solo cuando el contexto confirma
  // la sesión, no justo al resolver login(), para no adelantarse al listener
  // de Supabase y acabar de vuelta en esta pantalla tras iniciar sesión bien.
  useEffect(() => {
    if (!loading && session) {
      navigate("/cuenta", { replace: true });
    }
  }, [loading, session, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Introduce tu email y contraseña");
      return;
    }

    setCargando(true);
    try {
      await login(email, password);
    } catch {
      setError("Email o contraseña incorrectos");
      setCargando(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-sm flex-col px-4 py-10 lg:py-16">
        <Card className="p-6 lg:p-8">
          <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">Iniciar sesión</h1>
          <p className="mb-6 mt-1 text-[13.5px] text-ink-muted">
            Accede a tu cuenta para reservar sin rellenar tus datos cada vez.
          </p>

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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[12.5px] font-medium text-ink-muted">Contraseña</label>
                <Link to="/cuenta/recuperar" className="text-[12px] font-medium text-sage-700 underline underline-offset-2">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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

          <p className="mt-5 text-center text-[13px] text-ink-muted">
            ¿Todavía no tienes cuenta?{" "}
            <Link to="/cuenta/registro" className="font-medium text-sage-700 underline underline-offset-2">
              Regístrate
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
