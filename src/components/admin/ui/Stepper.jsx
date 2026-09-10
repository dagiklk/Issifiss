import clsx from "clsx";
import { Check } from "lucide-react";

export default function Stepper({ steps, current }) {
  const pct = (current / (steps.length - 1)) * 100;
  return (
    <div className="px-4 pb-4 lg:px-8">
      {/* Mobile: compact progress bar */}
      <div className="lg:hidden">
        <p className="mb-2 text-[12.5px] font-medium text-ink-muted">
          Paso {current + 1} de {steps.length} · <span className="text-ink">{steps[current]}</span>
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-sunken">
          <div
            className="h-full rounded-full bg-sage-600 transition-[width] duration-300 ease-out"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step row */}
      <div className="relative hidden items-center lg:flex">
        <div className="absolute left-4 right-4 top-4 h-px bg-line" />
        <div
          className="absolute left-4 top-4 h-px bg-sage-600 transition-[width] duration-300 ease-out"
          style={{ width: `calc(${pct}% * 0.94)` }}
        />
        {steps.map((label, i) => (
          <div key={label} className="relative z-10 flex flex-1 flex-col items-center gap-2 first:items-start last:items-end">
            <span
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full border text-[12.5px] font-semibold transition-colors duration-200",
                i < current && "border-sage-600 bg-sage-600 text-white",
                i === current && "border-sage-600 bg-white text-sage-700",
                i > current && "border-line-strong bg-white text-ink-faint"
              )}
            >
              {i < current ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={clsx("text-[12px] font-medium", i <= current ? "text-ink" : "text-ink-faint")}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
