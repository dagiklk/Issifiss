import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";

// Placeholder legalmente sensible (NIF, dirección, colegiado...) que no podemos
// inventar: se muestra resaltado para que sea imposible publicarlo sin verlo.
export function Placeholder({ children }) {
  return (
    <mark className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[13px] font-medium text-amber-600">
      {children}
    </mark>
  );
}

export function Seccion({ titulo, children }) {
  return (
    <section>
      <h2 className="mb-2.5 font-display text-[16.5px] font-semibold text-ink">{titulo}</h2>
      <div className="flex flex-col gap-2.5 text-[14px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function LegalLayout({ titulo, children }) {
  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
        <h1 className="font-display text-[28px] font-semibold tracking-display text-ink sm:text-[32px]">{titulo}</h1>
        <p className="mt-2 text-[13px] text-ink-faint">Última actualización: septiembre de 2026</p>
        <div className="mt-8 flex flex-col gap-7">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
