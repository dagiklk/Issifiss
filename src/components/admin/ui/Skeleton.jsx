import clsx from "clsx";

export function Skeleton({ className }) {
  return <div className={clsx("animate-pulse rounded-lg bg-canvas-sunken", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}
