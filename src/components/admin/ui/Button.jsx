import clsx from "clsx";
import { forwardRef } from "react";

const VARIANTS = {
  primary: "bg-ink text-white hover:bg-[#000] active:bg-ink",
  accent: "bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-700",
  secondary: "bg-white text-ink border border-line-strong hover:bg-canvas-sunken",
  ghost: "bg-transparent text-ink hover:bg-black/[0.04]",
  danger: "bg-white text-rose-600 border border-rose-100 hover:bg-rose-50",
};

const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[15px] gap-2 rounded-xl",
  lg: "h-13 px-6 text-[16px] gap-2 rounded-2xl",
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
        "inline-flex items-center justify-center font-medium select-none",
        "transition-[transform,background-color,opacity] duration-150 ease-out",
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
