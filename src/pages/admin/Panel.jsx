import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Panel() {
  const { logout } = useAuth();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCitas();

    // Suscripción Realtime: refresca la lista ante cualquier cambio en "citas"
    const canal = supabase
      .channel("citas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, () => {
        cargarCitas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  async function cargarCitas() {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("citas")
      .select("id, fecha_hora_inicio, fecha_hora_fin, estado, notas, pacientes(nombre, telefono), servicios(nombre)")
      .gte("fecha_hora_inicio", desde.toISOString())
      .order("fecha_hora_inicio", { ascending: true });

    setCitas(data ?? []);
    setCargando(false);
  }

  async function cambiarEstado(id, nuevoEstado) {
    const { error } = await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      alert("No se pudo actualizar la cita. Inténtalo de nuevo.");
      return;
    }
    // La lista se refresca sola vía la suscripción Realtime
  }

  // Agrupar citas por día para pintarlas como agenda
  const citasPorDia = citas.reduce((acc, cita) => {
    const dia = new Date(cita.fecha_hora_inicio).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    acc[dia] = acc[dia] || [];
    acc[dia].push(cita);
    return acc;
  }, {});

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0">issifiss · Panel</h5>
          <span style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>Agenda de citas</span>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/pacientes" className="btn btn-outline-issi btn-sm">
            Pacientes
          </Link>
          <button className="btn btn-outline-issi btn-sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {cargando && <p style={{ color: "var(--text-2)" }}>Cargando agenda...</p>}

      {!cargando && citas.length === 0 && (
        <p style={{ color: "var(--text-2)" }}>No hay citas próximas.</p>
      )}

      {Object.entries(citasPorDia).map(([dia, citasDelDia]) => (
        <div key={dia} className="mb-4">
          <div className="section-title" style={{ fontSize: "1rem", textTransform: "capitalize" }}>
            {dia}
          </div>
          <div className="card-issi p-3">
            <table className="table-issi">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {citasDelDia.map((cita) => (
                  <tr key={cita.id}>
                    <td>
                      {new Date(cita.fecha_hora_inicio).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{cita.pacientes?.nombre ?? "—"}</td>
                    <td>{cita.servicios?.nombre ?? "—"}</td>
                    <td>
                      <span className={`badge-estado ${cita.estado}`}>{cita.estado}</span>
                    </td>
                    <td className="text-end">
                      {cita.estado === "pendiente" && (
                        <button
                          className="btn btn-outline-issi btn-sm me-2"
                          onClick={() => cambiarEstado(cita.id, "confirmada")}
                        >
                          Confirmar
                        </button>
                      )}
                      {cita.estado !== "cancelada" && cita.estado !== "completada" && (
                        <button
                          className="btn btn-outline-issi btn-sm"
                          onClick={() => cambiarEstado(cita.id, "cancelada")}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
