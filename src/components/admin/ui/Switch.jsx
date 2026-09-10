import clsx from "clsx";

export default function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-out",
        checked ? "bg-sage-600" : "bg-canvas-sunken"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-softer transition-transform duration-200 ease-out",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
