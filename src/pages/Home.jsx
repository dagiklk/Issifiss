import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Presentation, History, GraduationCap, Trophy, Stethoscope, Check, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import Button from "../components/admin/ui/Button.jsx";
import ecoDetalle from "../assets/ecografia/eco-detalle.jpg";
import ecoConsulta from "../assets/ecografia/eco-consulta.jpg";
import ecoVascular from "../assets/ecografia/eco-vascular.jpg";
import isaacPerfil from "../assets/educacion/isaac-fisioterapeuta-perfil.jpg";

// Curva de easing compartida con tailwind.config.js (transitionTimingFunction.out),
// para que las animaciones de scroll se sientan igual que el resto de la UI.
const EASE = [0.23, 1, 0.32, 1];

const VENTAJAS = [
  { icon: Search, titulo: "Localización precisa", texto: "Tendones, músculo y tejidos blandos, en directo." },
  { icon: Presentation, titulo: "Te mostramos el hallazgo", texto: "Vemos la imagen juntos y te explicamos qué significa." },
  { icon: History, titulo: "Resultado inmediato", texto: "Integrado en la misma sesión de fisioterapia." },
];

const CREDENCIALES = [
  { icon: GraduationCap, texto: "UFV + Universidad Europea" },
  { icon: Stethoscope, texto: "Ecografía incluida en consulta" },
  { icon: Trophy, texto: "Deporte de alto rendimiento" },
];

const TRUST_STRIP = [
  "Confirmación inmediata por email",
  "Cambia o cancela online",
  "Ecógrafo incluido, sin coste extra",
];

// El servicio de entrada natural para un paciente nuevo se destaca primero en
// la cuadrícula, aunque no sea el más barato (el orden por defecto es por
// precio ascendente).
const SERVICIO_DESTACADO = "primera visita";

// Envoltorio de scroll-reveal reutilizado por toda la página: aparece una vez,
// al entrar en el viewport, con la misma curva que el resto de la UI.
function Reveal({ children, delay = 0, y = 22, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

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

      const lista = [...(data ?? [])].sort((a, b) => {
        const aDestacado = a.nombre?.trim().toLowerCase().startsWith(SERVICIO_DESTACADO);
        const bDestacado = b.nombre?.trim().toLowerCase().startsWith(SERVICIO_DESTACADO);
        if (aDestacado && !bDestacado) return -1;
        if (bDestacado && !aDestacado) return 1;
        return 0;
      });
      setServicios(lista);
    }
    cargarServicios();
  }, []);

  return (
    <div className="site-app min-h-dvh overflow-x-clip bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-10 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
              Fisioterapia deportiva y rehabilitación
            </span>
            <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.08] tracking-display text-ink sm:text-[46px] lg:text-[54px]">
              Recupera tu <span className="text-sage-600">movimiento</span>, a tu ritmo.
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-muted">
              Sesiones personalizadas con ecografía diagnóstica incluida en consulta. Reserva
              online en menos de un minuto.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as={Link} to="/reservar" variant="accent" size="lg">
                Reservar cita
                <ArrowRight size={16} strokeWidth={2.2} />
              </Button>
              <Button as="a" href="#servicios" variant="secondary" size="lg">
                Ver servicios
              </Button>
            </div>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {TRUST_STRIP.map((texto) => (
                <div key={texto} className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
                  <Check size={15} strokeWidth={2.2} className="shrink-0 text-sage-600" />
                  {texto}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
          >
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
          </motion.div>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-24">
        <div
          className="grid grid-cols-1 gap-8 [grid-template-areas:'photo'_'heading'_'rest']
            lg:grid-cols-[minmax(0,300px)_1fr] lg:items-center lg:gap-x-14 lg:gap-y-6
            lg:[grid-template-areas:'photo_heading'_'photo_rest']"
        >
          <Reveal className="mx-auto w-full max-w-[280px] [grid-area:photo] lg:mx-0" y={0}>
            <div className="relative">
              <img
                src={isaacPerfil}
                alt="Isaac Rodríguez, fisioterapeuta, con la beca de graduación de la Universidad Francisco de Vitoria"
                className="aspect-[4/5] w-full rounded-3xl object-cover object-top shadow-raised"
              />
              <div className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-soft">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                  <GraduationCap size={18} strokeWidth={1.9} />
                </span>
                <p className="text-[13px] font-semibold leading-snug text-ink">
                  Grado + Máster en Fisioterapia Invasiva y Ecografía
                </p>
              </div>
            </div>
          </Reveal>

          <div className="[grid-area:heading]">
            <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
              Por qué elegirnos
            </span>
            <h2 className="mt-4 font-display text-[26px] font-semibold tracking-display text-ink sm:text-[28px]">
              Isaac Rodríguez, fisioterapeuta titulado
            </h2>
          </div>

          <div className="[grid-area:rest]">
            <p className="max-w-lg text-[15px] leading-relaxed text-ink-muted">
              Trato cercano y preciso, con formación académica sólida y experiencia en deporte de
              alto rendimiento: fútbol de Primera División Femenina, boxeo y competición.
            </p>

            <motion.div
              className="mt-6 flex flex-wrap gap-2.5"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
            >
              {CREDENCIALES.map(({ icon: Icon, texto }) => (
                <motion.div
                  key={texto}
                  variants={staggerItem}
                  className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink-soft shadow-softer"
                >
                  <Icon size={15} strokeWidth={2} className="shrink-0 text-sage-600" />
                  {texto}
                </motion.div>
              ))}
            </motion.div>

            <Button as={Link} to="/reservar" variant="accent" className="mt-7">
              Reservar cita
            </Button>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 lg:px-8 lg:py-24">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[26px] font-semibold tracking-display text-ink">Nuestros servicios</h2>
            <p className="mt-1.5 text-[14px] text-ink-muted">Elige tu sesión y resérvala en menos de un minuto.</p>
          </div>
        </Reveal>
        <motion.div
          className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {servicios.map((servicio) => (
            <motion.div key={servicio.id} variants={staggerItem}>
              <ServicioCard
                servicio={servicio}
                destacado={servicio.nombre?.trim().toLowerCase().startsWith(SERVICIO_DESTACADO)}
                onSelect={() => navigate("/reservar", { state: { servicioId: servicio.id } })}
              />
            </motion.div>
          ))}
          {servicios.length === 0 && (
            <p className="col-span-full py-6 text-center text-[13.5px] text-ink-faint">
              Todavía no hay servicios configurados. Añádelos en la tabla "servicios" de Supabase.
            </p>
          )}
        </motion.div>
        {servicios.length > 0 && (
          <Reveal className="mt-7 flex justify-center">
            <Button as={Link} to="/reservar" variant="accent">
              Ver horarios disponibles
            </Button>
          </Reveal>
        )}
      </section>

      {/* Ecografía */}
      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="grid grid-cols-2 gap-3.5">
            <img
              src={ecoConsulta}
              alt="Fisioterapeuta explicando una imagen de ecografía al paciente"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-softer"
            />
            <img
              src={ecoVascular}
              alt="Estudio ecográfico en consulta con doble monitor"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-softer"
            />
          </Reveal>

          <div>
            <Reveal>
              <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
                Diagnóstico por imagen
              </span>
              <h2 className="mb-3 mt-4 font-display text-[26px] font-semibold tracking-display text-ink">
                Ecografía musculoesquelética en la misma consulta
              </h2>
              <p className="text-[15px] leading-relaxed text-ink-muted">
                Localizamos la lesión en tiempo real y ajustamos el tratamiento en el momento, sin
                desplazamientos ni listas de espera.
              </p>
            </Reveal>
            <motion.ul
              className="mt-7 flex flex-col gap-4"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {VENTAJAS.map(({ icon: Icon, titulo, texto }) => (
                <motion.li key={titulo} variants={staggerItem} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{titulo}</p>
                    <p className="text-[13px] text-ink-muted">{texto}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <Reveal delay={0.15}>
              <Button as={Link} to="/reservar" variant="accent" className="mt-7">
                Reservar valoración con ecografía
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Llamada final a la acción */}
      <Reveal className="mx-auto max-w-5xl px-4 pb-16 lg:px-8 lg:pb-24" y={30}>
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-sage-700 p-9 text-center shadow-raised sm:flex-row sm:justify-between sm:p-12 sm:text-left">
          <div>
            <h2 className="font-display text-[26px] font-semibold tracking-display text-white sm:text-[28px]">
              ¿Listo para moverte mejor?
            </h2>
            <p className="mt-2 max-w-sm text-[14.5px] text-sage-50">
              Reserva tu cita en menos de un minuto, sin llamadas ni esperas.
            </p>
          </div>
          <Button as={Link} to="/reservar" variant="invert" size="lg" className="w-full shrink-0 sm:w-auto">
            Reservar cita
            <ArrowRight size={16} strokeWidth={2.2} />
          </Button>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
