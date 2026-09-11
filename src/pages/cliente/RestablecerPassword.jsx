import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function RestablecerPassword() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ nueva: "", confirmar: "" });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!passwords.nueva || passwords.nueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    try {
      await updatePassword(passwords.nueva);
      setListo(true);
      setTimeout(() => navigate("/cuenta"), 1500);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-sm flex-col px-4 py-10 lg:py-16">
        <Card className="p-6 lg:p-8">
          {loading ? (
            <p className="text-center text-[13.5px] text-ink-faint">Comprobando el enlace…</p>
          ) : !session ? (
            <div className="text-center">
              <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">Enlace no válido</h1>
              <p className="mt-1.5 text-[14px] text-ink-muted">
                Este enlace ha caducado o ya se ha usado. Pide uno nuevo para restablecer tu contraseña.
              </p>
              <Link
                to="/cuenta/recuperar"
                className="mt-4 inline-block text-[13px] font-medium text-sage-700 underline underline-offset-2"
              >
                Solicitar enlace nuevo
              </Link>
            </div>
          ) : listo ? (
            <p className="text-center text-[14px] text-ink-muted">Contraseña actualizada. Entrando en tu cuenta…</p>
          ) : (
            <>
              <h1 className="font-display text-[19px] font-semibold tracking-display text-ink">Elige una nueva contraseña</h1>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Nueva contraseña</label>
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={passwords.nueva}
                    onChange={(e) => setPasswords((p) => ({ ...p, nueva: e.target.value }))}
                    autoFocus
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
                {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
                <Button type="submit" variant="accent" block disabled={cargando} className="mt-1">
                  {cargando ? "Guardando…" : "Guardar contraseña"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
