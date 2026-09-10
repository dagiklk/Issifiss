import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

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
      navigate("/admin/panel");
    } catch (err) {
      setError("Email o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="container d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="col-md-4">
        <div className="card-issi p-4 p-md-5">
          <h5 className="mb-1">issifiss</h5>
          <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }} className="mb-4">
            Acceso para el equipo
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label-issi">Email</label>
              <input
                className="form-control-issi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <div className="mb-3">
              <label className="form-label-issi">Contraseña</label>
              <input
                className="form-control-issi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <div className="text-error mb-3">{error}</div>}
            <button className="btn btn-accent w-100" disabled={cargando}>
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
