import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Presentation, History } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import Button from "../components/admin/ui/Button.jsx";
import ecoDetalle from "../assets/ecografia/eco-detalle.jpg";
import ecoDetalle2 from "../assets/ecografia/eco-detalle-2.jpg";
import ecoConsulta from "../assets/ecografia/eco-consulta.jpg";
import ecoVascular from "../assets/ecografia/eco-vascular.jpg";

const VENTAJAS = [
  { icon: Search, titulo: "Localización precisa", texto: "Tendones, músculo y tejidos blandos, en directo." },
  { icon: Presentation, titulo: "Te mostramos el hallazgo", texto: "Vemos la imagen juntos y te explicamos qué significa." },
  { icon: History, titulo: "Resultado inmediato", texto: "Integrado en la misma sesión de fisioterapia." },
];

export default function Home() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    async function cargarServicios() {
      const { data } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      setServicios(data ?? []);
    }
    cargarServicios();
  }, []);

  return (
    <div className="site-app min-h-dvh bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
              Fisioterapia
            </span>
            <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] tracking-display text-ink sm:text-[42px] lg:text-[48px]">
              Recupera tu <span className="text-sage-600">movimiento</span>, a tu ritmo.
            </h1>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
              Sesiones personalizadas de fisioterapia deportiva y rehabilitación. Reserva tu cita
              online en menos de un minuto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} to="/reservar" variant="accent" size="lg">
                Reservar cita
              </Button>
              <Button as="a" href="#servicios" variant="secondary" size="lg">
                Ver servicios
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={ecoDetalle}
              alt="Fisioterapeuta realizando una ecografía diagnóstica en consulta"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-raised"
            />
            <div className="absolute -bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-soft sm:left-6 sm:right-auto sm:w-72">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                <i className="bi bi-soundwave text-[17px]"></i>
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">Ecógrafo en consulta</p>
                <p className="truncate text-[12px] text-ink-muted">Diagnóstico por imagen incluido</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 lg:px-8">
        <h2 className="mb-6 font-display text-[24px] font-semibold tracking-display text-ink">Nuestros servicios</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio) => (
            <ServicioCard key={servicio.id} servicio={servicio} onSelect={() => navigate("/reservar")} />
          ))}
          {servicios.length === 0 && (
            <p className="col-span-full py-6 text-center text-[13.5px] text-ink-faint">
              Todavía no hay servicios configurados. Añádelos en la tabla "servicios" de Supabase.
            </p>
          )}
        </div>
      </section>

      {/* Ecografía */}
      <section className="mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid grid-cols-2 gap-3">
            <img src={ecoConsulta} alt="Fisioterapeuta explicando una imagen de ecografía al paciente" className="col-span-2 aspect-[16/10] w-full rounded-2xl object-cover shadow-softer" />
            <img src={ecoVascular} alt="Estudio ecográfico en consulta con doble monitor" className="aspect-square w-full rounded-2xl object-cover shadow-softer" />
            <img src={ecoDetalle2} alt="Detalle de exploración con ecógrafo portátil" className="aspect-square w-full rounded-2xl object-cover shadow-softer" />
          </div>

          <div>
            <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
              Diagnóstico por imagen
            </span>
            <h2 className="mb-3 mt-4 font-display text-[24px] font-semibold tracking-display text-ink">
              Ecografía musculoesquelética en la misma consulta
            </h2>
            <p className="text-[14.5px] leading-relaxed text-ink-muted">
              Localizamos la lesión en tiempo real, te enseñamos la imagen en pantalla y ajustamos
              el tratamiento en el momento, sin desplazamientos ni listas de espera de radiología.
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {VENTAJAS.map(({ icon: Icon, titulo, texto }) => (
                <li key={titulo} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{titulo}</p>
                    <p className="text-[13px] text-ink-muted">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button as={Link} to="/reservar" variant="accent" className="mt-6">
              Reservar valoración con ecografía
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
