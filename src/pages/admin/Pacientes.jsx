import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [bonos, setBonos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPacientes();
  }, []);

  async function cargarPacientes() {
    const { data } = await supabase
      .from("pacientes")
      .select("id, nombre, telefono, email, fecha_alta, notas_generales")
      .order("nombre", { ascending: true });
    setPacientes(data ?? []);
    setCargando(false);
  }

  async function abrirFicha(paciente) {
    setPacienteActivo(paciente);
    const { data } = await supabase
      .from("bonos")
      .select("id, sesiones_totales, sesiones_usadas, fecha_compra, servicios(nombre)")
      .eq("paciente_id", paciente.id)
      .order("fecha_compra", { ascending: false });
    setBonos(data ?? []);
  }

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0">issifiss · Pacientes</h5>
          <span style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
            Fichas e historial de bonos
          </span>
        </div>
        <Link to="/admin/panel" className="btn btn-outline-issi btn-sm">
          Volver a la agenda
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <input
            className="form-control-issi mb-3"
            type="text"
            placeholder="Buscar paciente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="card-issi p-3">
            {cargando && <p style={{ color: "var(--text-2)" }}>Cargando pacientes...</p>}
            {!cargando && pacientesFiltrados.length === 0 && (
              <p style={{ color: "var(--text-2)" }}>No se encontraron pacientes.</p>
            )}
            <table className="table-issi">
              <tbody>
                {pacientesFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => abrirFicha(p)}
                    style={{
                      cursor: "pointer",
                      background: pacienteActivo?.id === p.id ? "var(--bg-2)" : "transparent",
                    }}
                  >
                    <td>{p.nombre}</td>
                    <td style={{ color: "var(--text-3)" }}>{p.telefono || p.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-7">
          {!pacienteActivo && (
            <div className="card-issi p-4">
              <p style={{ color: "var(--text-2)" }}>
                Selecciona un paciente de la lista para ver su ficha.
              </p>
            </div>
          )}

          {pacienteActivo && (
            <div className="card-issi p-4">
              <h5 className="mb-1">{pacienteActivo.nombre}</h5>
              <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
                {pacienteActivo.email || "Sin email"} · {pacienteActivo.telefono || "Sin teléfono"}
              </p>
              <p style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                Alta: {new Date(pacienteActivo.fecha_alta).toLocaleDateString("es-ES")}
              </p>

              {pacienteActivo.notas_generales && (
                <>
                  <hr className="divider my-3" />
                  <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
                    {pacienteActivo.notas_generales}
                  </p>
                </>
              )}

              <hr className="divider my-3" />
              <div className="section-title" style={{ fontSize: "1rem" }}>
                Bonos
              </div>

              {bonos.length === 0 && (
                <p style={{ color: "var(--text-2)" }}>Este paciente no tiene bonos registrados.</p>
              )}

              {bonos.map((bono) => (
                <div
                  key={bono.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                  style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{bono.servicios?.nombre ?? "Bono"}</div>
                    <div style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                      Comprado el {new Date(bono.fecha_compra).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  <span className="precio">
                    {bono.sesiones_usadas} / {bono.sesiones_totales} sesiones
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
