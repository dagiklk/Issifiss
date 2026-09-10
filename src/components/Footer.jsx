export default function Footer() {
  return (
    <div className="footer-issi">
      <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>© {new Date().getFullYear()} issifiss · Fisioterapia</div>
        <div className="d-flex gap-3">
          <a href="https://instagram.com/issifiss" target="_blank" rel="noreferrer">
            <i className="bi bi-instagram"></i> @issifiss
          </a>
          <a href="/aviso-legal">Aviso legal</a>
          <a href="/privacidad">Privacidad</a>
        </div>
      </div>
    </div>
  );
}
