import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ClientProtectedRoute({ children }) {
  const { session, loading } = useAuth();

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

  return children;
}
