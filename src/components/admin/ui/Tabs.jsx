import { motion } from "motion/react";
import clsx from "clsx";

/**
 * Segmented control with a shared-layout sliding pill (motion layoutId).
 * Purpose: state indication (which tab is active) — see animate skill.
 */
export default function Tabs({ items, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-canvas-sunken p-1 text-[13px] font-medium",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={clsx(
              "relative z-0 rounded-full px-3.5 py-1.5 transition-colors duration-150",
              active ? "text-ink" : "text-ink-muted hover:text-ink-soft"
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${items.map((i) => i.value).join("-")}`}
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-softer"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            {item.label}
            {typeof item.count === "number" && (
              <span className={clsx("ml-1.5 tabular-nums", active ? "text-ink-muted" : "text-ink-faint")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
