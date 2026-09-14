import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Un admin logueado no tiene ningún flujo válido en las páginas públicas de
// cliente (reservar como invitado, "Mi cuenta" de paciente...) — y como esas
// rutas no comprobaban esto, volver atrás con el navegador desde /admin podía
// dejar al fisio en un flujo roto (reservando "como invitado" estando
// autenticado como admin, o disparando la creación de una ficha de paciente
// para su propia cuenta de fisio). En vez de intentar bloquear el botón
// "atrás" del navegador (poco fiable y mala UX), redirigimos de vuelta al
// panel en cualquier acceso a estas rutas mientras haya sesión de admin.
export default function RedirectIfAdmin({ children, to = "/admin" }) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="site-app flex min-h-dvh items-center justify-center bg-canvas">
        <span className="text-[13.5px] text-ink-muted">Cargando…</span>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to={to} replace />;
  }

  return children;
}
