import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import clsx from "clsx";
import { CalendarDays, Euro, Home, ListChecks, MoreHorizontal, Settings, LogOut, X, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";

const NAV_ID = "bottom-nav-pill";

const PRIMARY = [
  { to: "/admin", label: "Inicio", icon: Home, end: true },
  { to: "/admin/citas", label: "Citas", icon: ListChecks },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
];

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className="relative flex flex-1 flex-col items-center gap-1 py-1.5">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={NAV_ID}
              className="absolute -top-1 h-1 w-5 rounded-full bg-sage-600"
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            />
          )}
          <span
            className={clsx(
              "flex h-7 w-7 items-center justify-center transition-transform duration-150 active:scale-90",
              isActive ? "text-ink" : "text-ink-faint"
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.1 : 1.8} />
          </span>
          <span className={clsx("text-[10.5px] font-medium", isActive ? "text-ink" : "text-ink-faint")}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/85 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="relative flex flex-1 flex-col items-center gap-1 py-1.5 text-ink-faint transition-transform duration-150 active:scale-90"
          >
            <span className="flex h-7 w-7 items-center justify-center">
              <MoreHorizontal size={22} strokeWidth={1.8} />
            </span>
            <span className="text-[10.5px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.05 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-sheet"
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-[16px] font-semibold tracking-display">Más</span>
              <button
                aria-label="Cerrar"
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>
            <div className="mt-3 px-3 pb-2">
              <button
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/admin/ajustes");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink transition-colors active:bg-canvas-sunken"
              >
                <Settings size={19} strokeWidth={1.8} className="text-ink-muted" />
                Ajustes
              </button>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/admin/pacientes");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink transition-colors active:bg-canvas-sunken"
              >
                <Users size={19} strokeWidth={1.8} className="text-ink-muted" />
                Pacientes
              </button>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/admin/ingresos");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink transition-colors active:bg-canvas-sunken"
              >
                <Euro size={19} strokeWidth={1.8} className="text-ink-muted" />
                Ingresos
              </button>
              <div className="my-2 h-px bg-line" />
              <button
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-rose-600 transition-colors active:bg-rose-50"
              >
                <LogOut size={19} strokeWidth={1.8} />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
