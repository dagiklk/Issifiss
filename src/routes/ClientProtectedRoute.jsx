import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ClientProtectedRoute({ children }) {
  const { session, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="site-app flex min-h-dvh items-center justify-center bg-canvas">
        <span className="text-[13.5px] text-ink-muted">Cargando…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/cuenta/login" replace />;
  }

  // Un admin no tiene ficha de paciente propia: dejarle entrar aquí (p.ej.
  // volviendo atrás con el navegador desde /admin) rompía la página al
  // intentar crearle una. Esta cuenta no es de cliente, así que al panel.
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
