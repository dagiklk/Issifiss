import clsx from "clsx";

export default function Card({ as: Component = "div", className, interactive, children, ...props }) {
  return (
    <Component
      className={clsx(
        "bg-white rounded-2xl border border-line shadow-softer",
        interactive &&
          "transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.985] hover:shadow-soft cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
