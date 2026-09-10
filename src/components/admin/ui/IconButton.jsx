import clsx from "clsx";
import { forwardRef } from "react";

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

const IconButton = forwardRef(function IconButton(
  { size = "md", variant = "ghost", className, children, "aria-label": ariaLabel, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={clsx(
        "inline-flex items-center justify-center rounded-full shrink-0",
        "transition-[transform,background-color] duration-150 ease-out active:scale-[0.92]",
        variant === "ghost" && "text-ink-soft hover:bg-black/[0.05]",
        variant === "solid" && "bg-canvas-sunken text-ink hover:bg-black/[0.07]",
        variant === "accent" && "bg-sage-50 text-sage-700 hover:bg-sage-100",
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default IconButton;
