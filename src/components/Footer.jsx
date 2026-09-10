export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas-sunken/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
        <p className="text-[13px] text-ink-muted">© {new Date().getFullYear()} issifiss · Fisioterapia</p>
        <div className="flex items-center gap-5 text-[13px] text-ink-muted">
          <a href="https://instagram.com/issifiss" target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">
            @issifiss
          </a>
          <a href="/aviso-legal" className="transition-colors hover:text-ink">Aviso legal</a>
          <a href="/privacidad" className="transition-colors hover:text-ink">Privacidad</a>
        </div>
      </div>
    </footer>
  );
}
