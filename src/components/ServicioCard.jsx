import clsx from "clsx";
import { Check } from "lucide-react";

// "icono_bi" es una columna opcional en la tabla "servicios" de Supabase:
// guarda el nombre de un icono de Bootstrap Icons (ej. "bi-heart-pulse",
// "bi-lightning-charge") y se usará automáticamente. Bootstrap Icons es solo
// una fuente de iconos, así que convive sin problema con el resto en Tailwind.
const ICONO_POR_DEFECTO = "bi-clipboard2-pulse";

// Mientras la columna "icono_bi" no esté rellenada en Supabase, asignamos un
// icono distinto por nombre de servicio para que la cuadrícula no se vea
// repetitiva. En cuanto se rellene icono_bi en la base de datos, ese valor
// tiene prioridad y este mapa deja de usarse para ese servicio.
const ICONOS_POR_NOMBRE = {
  "primera visita": "bi-clipboard2-check",
  "rehabilitación física": "bi-activity",
  "electroterapia": "bi-lightning-charge",
  "diatermia": "bi-broadcast",
  "neuromodulación percutánea": "bi-bullseye",
  "presoterapia": "bi-arrow-up-square",
};

function iconoPara(servicio) {
  if (servicio.icono_bi) return servicio.icono_bi;
  const clave = servicio.nombre?.trim().toLowerCase();
  return ICONOS_POR_NOMBRE[clave] || ICONO_POR_DEFECTO;
}

export default function ServicioCard({ servicio, seleccionado = false, destacado = false, onSelect }) {
  const icono = iconoPara(servicio);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(servicio)}
      className={clsx(
        "relative flex w-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-150 ease-out active:scale-[0.985]",
        seleccionado
          ? "border-sage-400 bg-sage-50/60 shadow-soft"
          : destacado
          ? "border-sage-300 bg-gradient-to-b from-sage-50 to-white shadow-soft hover:shadow-softer"
          : "border-line bg-white hover:border-line-strong hover:shadow-softer"
      )}
    >
      {destacado && !seleccionado && (
        <span className="absolute -top-2.5 right-3.5 rounded-full bg-sage-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Recomendado
        </span>
      )}
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl text-[17px]",
            seleccionado || destacado ? "bg-sage-600 text-white" : "bg-sage-50 text-sage-700"
          )}
        >
          <i className={`bi ${icono}`}></i>
        </span>
        {seleccionado && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-white">
            <Check size={13} strokeWidth={2.6} />
          </span>
        )}
      </div>
      <h3 className="mt-1 text-[15px] font-semibold text-ink">{servicio.nombre}</h3>
      {servicio.descripcion && <p className="text-[13px] leading-relaxed text-ink-muted">{servicio.descripcion}</p>}
      <div className="mt-1 flex w-full items-center justify-between">
        {servicio.precio != null && (
          <span className="text-[15px] font-semibold tabular-nums text-ink">{Number(servicio.precio).toFixed(2)} €</span>
        )}
        <span className="text-[12.5px] text-ink-faint">{servicio.duracion_minutos} min</span>
      </div>
    </button>
  );
}
