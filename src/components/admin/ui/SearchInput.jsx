import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Buscar", className, autoFocus }) {
  return (
    <div className={"relative " + (className || "")}>
      <Search size={17} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-9 text-[15px] text-ink placeholder:text-ink-faint transition-shadow duration-150 focus:border-sage-300 focus:shadow-[0_0_0_4px_theme(colors.sage.100)]"
      />
      {value && (
        <button
          aria-label="Borrar búsqueda"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted transition-transform duration-150 active:scale-90"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
