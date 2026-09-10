export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={"flex flex-col items-center justify-center text-center px-6 py-14 " + (className || "")}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas-sunken text-ink-faint">
          <Icon size={24} strokeWidth={1.6} />
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-[280px] text-[13.5px] leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
