import { Link } from "react-router-dom";
import { User } from "lucide-react";
import Button from "./admin/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { session, isAdmin } = useAuth();
  const cliente = session && !isAdmin;

  return (
    // Flota separada del borde en vez de pegada a todo el ancho, con la
    // barra en sí redondeada del todo (rounded-full) — el look "pill
    // flotante" más moderno frente a la tira recta de antes.
    <header className="sticky top-3 z-20 px-3 lg:top-4 lg:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border border-line bg-white/85 py-2 pl-3.5 pr-2 shadow-soft backdrop-blur-xl backdrop-saturate-150 lg:pl-5 lg:pr-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="issifiss" className="h-8 w-8 object-contain" />
          <span className="whitespace-nowrap font-display text-[17px] font-semibold tracking-display text-ink">
            issi<span className="text-sage-600">fiss</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href="https://instagram.com/issifiss"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de issifiss"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink sm:flex"
          >
            <i className="bi bi-instagram text-[16px]"></i>
          </a>
          <Button
            as={Link}
            to={cliente ? "/cuenta" : "/cuenta/login"}
            variant="secondary"
            size="sm"
            className="shrink-0"
            aria-label={cliente ? "Mi cuenta" : "Iniciar sesión"}
          >
            <User size={15} strokeWidth={2} />
            <span className="hidden whitespace-nowrap sm:inline">{cliente ? "Mi cuenta" : "Iniciar sesión"}</span>
          </Button>
          <Button as={Link} to="/reservar" variant="accent" size="sm" className="shrink-0 whitespace-nowrap">
            Reservar cita
          </Button>
        </div>
      </div>
    </header>
  );
}
