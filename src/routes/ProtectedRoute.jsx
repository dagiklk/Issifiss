import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { session, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="site-app flex min-h-dvh items-center justify-center bg-canvas">
        <span className="text-[13.5px] text-ink-muted">Cargando…</span>
      </div>
    );
  }

  // Client accounts share the same Supabase Auth users table as the physio's
  // admin account, so a logged-in session alone isn't enough here — it also
  // has to belong to the "admins" allowlist (see AuthContext.jsx).
  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
