/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  // Bootstrap still loads globally (main.jsx) — Login.jsx is the only page
  // still built with it. Bootstrap's own utility classes (p-*, m-*, gap-*,
  // border, rounded, d-flex...) share names with Tailwind's and ship
  // !important, so without this, Bootstrap silently wins on every colliding
  // class name (confirmed: it was collapsing all spacing/sizing in /admin).
  // Making every Tailwind utility !important, combined with Tailwind's CSS
  // loading after Bootstrap's (see main.jsx import order), restores the
  // intended cascade wherever Tailwind classes are actually used (the /admin
  // UI and the public Home/Reservar/Cancelar pages) — Login.jsx is untouched
  // since its JSX only ever uses Bootstrap class names.
  important: true,
  content: [
    "./index.html",
    "./src/components/**/*.{js,jsx}",
    "./src/pages/**/*.{js,jsx}",
  ],
  corePlugins: {
    // Login.jsx still runs on plain Bootstrap. Preflight is a global
    // element-selector reset and would fight Bootstrap's Reboot there.
    // A small reset scoped to .admin-app/.site-app (bottom of
    // src/index.css) replaces it for every Tailwind-built page instead.
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "-apple-system", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#1D1D1F", soft: "#48484D", muted: "#6E6E73", faint: "#A1A1A6" },
        canvas: { DEFAULT: "#F5F5F7", raised: "#FFFFFF", sunken: "#EDEDEF" },
        line: { DEFAULT: "rgba(60,60,67,0.10)", strong: "rgba(60,60,67,0.16)" },
        sage: {
          50: "#EFF8F5", 100: "#DCF0EA", 200: "#B7E1D5", 300: "#8ECEBC", 400: "#5FB7A0",
          500: "#2F9C84", 600: "#1E8271", 700: "#146A5D", 800: "#0F544A", 900: "#0B3F39",
        },
        amber: { 50: "#FDF6E9", 100: "#FBEACB", 500: "#D89A2B", 600: "#B07B1A" },
        rose: { 50: "#FDEEEE", 100: "#FBDCDC", 500: "#D5615C", 600: "#B84843" },
      },
      borderRadius: { xl2: "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,22,0.04), 0 6px 20px -8px rgba(20,20,22,0.10)",
        softer: "0 1px 1px rgba(20,20,22,0.03), 0 2px 8px -2px rgba(20,20,22,0.06)",
        raised: "0 2px 4px rgba(20,20,22,0.04), 0 16px 32px -12px rgba(20,20,22,0.14)",
        sheet: "0 -4px 24px rgba(20,20,22,0.10)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      spacing: { safe: "env(safe-area-inset-bottom)" },
    },
  },
  plugins: [],
};
