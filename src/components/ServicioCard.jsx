import clsx from "clsx";
import { Check } from "lucide-react";

// "icono_bi" es una columna opcional en la tabla "servicios" de Supabase:
// guarda el nombre de un icono de Bootstrap Icons (ej. "bi-heart-pulse",
// "bi-lightning-charge") y se usará automáticamente. Bootstrap Icons es solo
// una fuente de iconos, así que convive sin problema con el resto en Tailwind.
const ICONO_POR_DEFECTO = "bi-clipboard2-pulse";

export default function ServicioCard({ servicio, seleccionado = false, onSelect }) {
  const icono = servicio.icono_bi || ICONO_POR_DEFECTO;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(servicio)}
      className={clsx(
        "flex w-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-150 ease-out active:scale-[0.985]",
        seleccionado ? "border-sage-400 bg-sage-50/60 shadow-soft" : "border-line bg-white hover:border-line-strong hover:shadow-softer"
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl text-[17px]",
            seleccionado ? "bg-sage-600 text-white" : "bg-sage-50 text-sage-700"
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
