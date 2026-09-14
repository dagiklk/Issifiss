import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Card from "../components/admin/ui/Card.jsx";
import Button from "../components/admin/ui/Button.jsx";

export default function NotFound() {
  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-8 lg:px-8 lg:py-12">
        <Card className="p-6 text-center lg:p-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted">
            <Compass size={28} strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-[13px] font-semibold uppercase tracking-eyebrow text-ink-faint">Error 404</p>
          <h1 className="mt-1.5 font-display text-[19px] font-semibold tracking-display text-ink">
            Esta página no existe
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            Comprueba el enlace o vuelve al inicio para seguir navegando.
          </p>
          <Button as={Link} to="/" variant="accent" block className="mt-5">
            Ir al inicio
          </Button>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
