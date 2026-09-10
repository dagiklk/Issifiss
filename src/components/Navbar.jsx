import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-issi py-3">
      <div className="container">
        <Link className="navbar-brand" to="/">
          issi<span>fiss</span>
        </Link>
        <div className="ms-auto d-flex align-items-center gap-3">
          <a
            className="nav-link"
            href="https://instagram.com/issifiss"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de issifiss"
          >
            <i className="bi bi-instagram"></i>
          </a>
          <Link to="/reservar" className="btn btn-accent btn-sm">
            Reservar cita
          </Link>
        </div>
      </div>
    </nav>
  );
}
