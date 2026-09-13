import clsx from "clsx";
import { forwardRef } from "react";

const VARIANTS = {
  primary: "bg-ink text-white shadow-softer hover:bg-[#000] active:bg-ink",
  accent: "bg-sage-600 text-white shadow-[0_10px_24px_-10px_rgba(30,130,113,0.55)] hover:bg-sage-700 hover:shadow-[0_14px_30px_-10px_rgba(30,130,113,0.6)] active:bg-sage-700",
  secondary: "bg-white text-ink border border-line-strong hover:bg-canvas-sunken",
  ghost: "bg-transparent text-ink hover:bg-black/[0.04]",
  danger: "bg-white text-rose-600 border border-rose-100 hover:bg-rose-50",
  // Botón claro para usar sobre fondos de color (p. ej. la tarjeta sage-700
  // de la llamada final a la acción). Variante propia en vez de sobreescribir
  // bg-*/text-* por className: con `important: true` dos utilidades Tailwind
  // sobre la misma propiedad tienen un ganador indefinido según el orden de
  // generación del CSS, no el orden en el JSX.
  invert: "bg-white text-sage-700 hover:bg-sage-50 active:bg-sage-50",
};

// Antes eran muy finos (h-9/h-11/h-13, font-medium): se suben alturas,
// paddings y grosor de fuente en todo el sitio para que se sientan botones
// "premium", no controles de formulario genéricos.
const SIZES = {
  sm: "h-10 px-4 text-[13.5px] gap-1.5 rounded-xl",
  md: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  lg: "h-14 px-8 text-[16.5px] gap-2 rounded-2xl",
};

/**
 * Base pressable button. Feedback lives on press (:active), not on release —
 * see apple-design skill, "Response". Keep durations under 200ms.
 */
const Button = forwardRef(function Button(
  { as: Component = "button", variant = "primary", size = "md", block, className, children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center font-semibold select-none",
        "transition-[transform,background-color,box-shadow,opacity] duration-150 ease-out",
        "active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
        block && "w-full",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Button;
