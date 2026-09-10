import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconButton from "../ui/IconButton";

/**
 * Sticky, translucent page header — content scrolls underneath rather than
 * a fixed opaque strip (apple-design skill §12, "materials & depth").
 */
export default function PageHeader({ title, subtitle, back, actions, sticky = true, large, className }) {
  const navigate = useNavigate();
  return (
    <header
      className={clsx(
        sticky && "sticky top-0 z-20 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150",
        "border-b border-transparent",
        className
      )}
    >
      <div
        className={clsx(
          "mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 lg:px-8 lg:pt-6",
          large && "lg:pb-5"
        )}
      >
        {back && (
          <IconButton
            aria-label="Volver"
            variant="solid"
            onClick={() => (typeof back === "function" ? back() : navigate(back === true ? -1 : back))}
            className="shrink-0"
          >
            <ChevronLeft size={19} strokeWidth={2.2} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={clsx(
              "truncate font-display font-semibold tracking-display text-ink",
              large ? "text-[26px] lg:text-[30px]" : "text-[19px]"
            )}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 truncate text-[13.5px] text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
