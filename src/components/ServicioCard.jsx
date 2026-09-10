// Iconos disponibles según el nombre del servicio; "icono_bi" opcional en la
// fila de Supabase permite elegir uno concreto (ver comentario más abajo).
const ICONO_POR_DEFECTO = "bi-clipboard2-pulse";

export default function ServicioCard({ servicio, seleccionado = false, onSelect }) {
  const icono = servicio.icono_bi || ICONO_POR_DEFECTO;

  return (
    <div
      className={`servicio-card ${seleccionado ? "selected" : ""}`}
      onClick={() => onSelect?.(servicio)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(servicio);
      }}
    >
      <div className="icono">
        <i className={`bi ${icono}`}></i>
      </div>
      <h5>{servicio.nombre}</h5>
      {servicio.descripcion && <p className="muted">{servicio.descripcion}</p>}
      <div className="d-flex justify-content-between align-items-center mt-3">
        {servicio.precio != null && (
          <span className="precio">{Number(servicio.precio).toFixed(2)}€</span>
        )}
        <span style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>
          {servicio.duracion_minutos} min
        </span>
      </div>
    </div>
  );
}

// Nota: si añades una columna "icono_bi" (text) a la tabla "servicios" en
// Supabase, puedes guardar el nombre de un icono de Bootstrap Icons
// (ej. "bi-heart-pulse", "bi-lightning-charge") y se usará automáticamente.
