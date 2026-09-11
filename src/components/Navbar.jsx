import { Link } from "react-router-dom";
import { User } from "lucide-react";
import Button from "./admin/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { session, isAdmin } = useAuth();
  const cliente = session && !isAdmin;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 lg:px-8">
        <Link to="/" className="font-display text-[19px] font-semibold tracking-display text-ink">
          issi<span className="text-sage-600">fiss</span>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com/issifiss"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de issifiss"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink"
          >
            <i className="bi bi-instagram text-[16px]"></i>
          </a>
          <Button
            as={Link}
            to={cliente ? "/cuenta" : "/cuenta/login"}
            variant="secondary"
            size="sm"
            aria-label={cliente ? "Mi cuenta" : "Iniciar sesión"}
          >
            <User size={15} strokeWidth={2} className="-ml-0.5" />
            {cliente ? "Mi cuenta" : "Iniciar sesión"}
          </Button>
          <Button as={Link} to="/reservar" variant="accent" size="sm">
            Reservar cita
          </Button>
        </div>
      </div>
    </header>
  );
}
