import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import clsx from "clsx";
import { CalendarDays, Home, ListChecks, LogOut, Settings, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { displayNameFromSession } from "../../../utils/dateHelpers.js";
import Avatar from "../ui/Avatar.jsx";

const LINKS = [
  { to: "/admin", label: "Inicio", icon: Home, end: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/admin/citas", label: "Citas", icon: ListChecks },
  { to: "/admin/pacientes", label: "Pacientes", icon: Users },
  { to: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const name = displayNameFromSession(user);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white/70 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-6 pt-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-600 text-[13px] font-bold tracking-tight text-white">
          if
        </div>
        <div>
          <p className="font-display text-[15px] font-semibold leading-none tracking-display text-ink">issifiss</p>
          <p className="mt-1 text-[11.5px] text-ink-faint">Panel de gestión</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-0.5 px-3">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative">
            {({ isActive }) => (
              <span
                className={clsx(
                  "relative z-0 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-150",
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink hover:bg-black/[0.03]"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-sage-50"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.1 : 1.8} className={isActive ? "text-sage-700" : undefined} />
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
            <p className="truncate text-[11.5px] text-ink-faint">{user?.email}</p>
          </div>
          <button
            aria-label="Cerrar sesión"
            onClick={logout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </aside>
  );
}
