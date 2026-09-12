import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas-sunken/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="issifiss" className="h-6 w-6 object-contain" />
          <p className="text-[13px] text-ink-muted">© {new Date().getFullYear()} issifiss · Fisioterapia</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-ink-muted">
          <a href="https://instagram.com/issifiss" target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">
            @issifiss
          </a>
          <Link to="/aviso-legal" className="transition-colors hover:text-ink">Aviso legal</Link>
          <Link to="/privacidad" className="transition-colors hover:text-ink">Privacidad</Link>
          <Link to="/terminos" className="transition-colors hover:text-ink">Términos y condiciones</Link>
        </div>
      </div>
    </footer>
  );
}
