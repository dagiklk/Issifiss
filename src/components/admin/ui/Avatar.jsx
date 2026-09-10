import clsx from "clsx";

// Soft, desaturated pairs — enough hue variety to tell patients apart at a
// glance without the screen reading as colorful/SaaS.
const PALETTE = [
  { bg: "#E7F3EF", fg: "#1E8271" },
  { bg: "#FBEACB", fg: "#8A5A16" },
  { bg: "#FBDCDC", fg: "#A5433E" },
  { bg: "#E8EEF6", fg: "#3F5E82" },
  { bg: "#F1E9F5", fg: "#6E4C81" },
  { bg: "#EFF0E4", fg: "#5B6136" },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-[14px]",
  lg: "h-16 w-16 text-[20px]",
  xl: "h-20 w-20 text-[26px]",
};

export default function Avatar({ name = "", initials, size = "md", className }) {
  const label = initials || name.slice(0, 2).toUpperCase();
  const { bg, fg } = PALETTE[hashString(name || label) % PALETTE.length];
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0 tracking-tight",
        SIZES[size],
        className
      )}
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}
