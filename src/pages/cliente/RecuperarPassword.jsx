import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function RecuperarPassword() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Introduce tu email");
      return;
    }

    setCargando(true);
    try {
      await resetPasswordForEmail(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err.message || "No se pudo enviar el email de recuperación");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-sm flex-col px-4 py-10 lg:py-16">
        <Card className="p-6 lg:p-8">
          {enviado ? (
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                <MailCheck size={28} strokeWidth={2} />
              </span>
              <h1 className="mt-5 font-display text-[19px] font-semibold tracking-display text-ink">Revisa tu email</h1>
              <p className="mt-1.5 text-[14px] text-ink-muted">
                Te hemos enviado un enlace para restablecer tu contraseña.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">Recuperar contraseña</h1>
              <p className="mb-6 mt-1 text-[13.5px] text-ink-muted">
                Te enviaremos un enlace a tu email para elegir una contraseña nueva.
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
                {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
                <Button type="submit" variant="accent" block disabled={cargando} className="mt-1">
                  {cargando ? "Enviando…" : "Enviar enlace"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-[13px] text-ink-muted">
            <Link to="/cuenta/login" className="font-medium text-sage-700 underline underline-offset-2">
              Volver a iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
