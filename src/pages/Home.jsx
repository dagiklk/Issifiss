import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Search,
  Presentation,
  History,
  GraduationCap,
  Trophy,
  Stethoscope,
  Check,
  ArrowRight,
  CalendarCheck2,
  ClipboardCheck,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import Button from "../components/admin/ui/Button.jsx";
import ecoDetalle from "../assets/ecografia/eco-detalle.jpg";
import ecoConsulta from "../assets/ecografia/eco-consulta.jpg";
import ecoVascular from "../assets/ecografia/eco-vascular.jpg";
import isaacPerfil from "../assets/educacion/isaac-fisioterapeuta-perfil.jpg";
import diplomaGrado from "../assets/educacion/diploma-grado-fisioterapia-ufv.jpg";

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
  { icon: CalendarCheck2, texto: "Confirmación inmediata por email" },
  { icon: ShieldCheck, texto: "Cambia o cancela online" },
  { icon: Stethoscope, texto: "Ecógrafo incluido, sin coste extra" },
];

const PASOS = [
  {
    numero: "01",
    icon: CalendarCheck2,
    titulo: "Reserva online",
    texto: "Elige servicio y horario disponible. Sin llamadas, en menos de un minuto.",
  },
  {
    numero: "02",
    icon: Stethoscope,
    titulo: "Consulta con ecografía",
    texto: "Valoramos y localizamos la lesión en tiempo real con el ecógrafo, incluido en la sesión.",
  },
  {
    numero: "03",
    icon: ClipboardCheck,
    titulo: "Plan de tratamiento",
    texto: "Salimos de la consulta con un diagnóstico claro y los siguientes pasos definidos.",
  },
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
      transition={{ duration: 0.7, ease: EASE, delay }}
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

// Etiqueta reutilizada como "eyebrow" editorial encima de cada titular de
// sección — la misma pastilla sage-50 en todas partes da consistencia visual
// sin depender de color adicional.
function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12.5px] font-medium text-sage-700">
      {children}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], [0, 36]);

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

      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
      >
        {/* Fondo: una única mancha de color muy sutil, no un gradiente vistoso */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_82%_8%,theme(colors.sage.50),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-24 lg:pt-24 xl:min-h-[calc(100dvh-72px)] xl:pb-28 xl:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <Eyebrow>Fisioterapia deportiva y rehabilitación</Eyebrow>
            <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.04] tracking-display text-ink sm:text-[56px] lg:text-[64px] xl:text-[72px]">
              Recupera tu
              <br />
              <span className="text-sage-600">movimiento</span>, a tu ritmo.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-muted">
              Sesiones personalizadas con ecografía diagnóstica incluida en consulta. Reserva
              online en menos de un minuto.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button as={Link} to="/reservar" variant="accent" size="lg">
                Reservar cita
                <ArrowRight size={16} strokeWidth={2.2} />
              </Button>
              <Button as="a" href="#servicios" variant="secondary" size="lg">
                Ver servicios
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[420px] lg:max-w-none"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            style={{ y: heroImgY }}
          >
            <div className="relative">
              <img
                src={ecoDetalle}
                alt="Fisioterapeuta realizando una ecografía diagnóstica en consulta"
                className="aspect-[4/5] w-full rounded-[28px] object-cover shadow-raised sm:aspect-[4/3] lg:aspect-[4/5]"
              />
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
                className="absolute -bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3.5 shadow-soft backdrop-blur sm:left-6 sm:right-auto sm:w-72"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                  <i className="bi bi-soundwave text-[17px]"></i>
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">Ecógrafo en consulta</p>
                  <p className="truncate text-[12px] text-ink-muted">Diagnóstico por imagen incluido</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
                className="absolute -top-5 -right-3 hidden items-center gap-2 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur sm:flex"
              >
                <Check size={16} strokeWidth={2.6} className="text-sage-600" />
                <p className="whitespace-nowrap text-[12.5px] font-semibold text-ink">Cita en &lt;1 min</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Franja de confianza: cierra el hero con hechos concretos, sin relleno */}
        <div className="border-y border-line bg-canvas-sunken/60">
          <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:gap-y-2.5">
              {TRUST_STRIP.map(({ icon: Icon, texto }) => (
                <div key={texto} className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
                  <Icon size={15} strokeWidth={2.1} className="shrink-0 text-sage-600" />
                  {texto}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENTO: POR QUÉ ELEGIRNOS ================= */}
      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
        <Reveal className="mx-auto mb-10 max-w-xl text-center lg:mb-14">
          <Eyebrow>Por qué elegirnos</Eyebrow>
          <h2 className="mt-4 font-display text-[30px] font-semibold tracking-display text-ink sm:text-[36px]">
            Un fisioterapeuta, no una cadena de citas
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Tarjeta grande: bio de Isaac */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-softer sm:flex-row sm:items-center sm:gap-8 sm:p-8">
              <img
                src={isaacPerfil}
                alt="Isaac Rodríguez, fisioterapeuta"
                className="aspect-[4/5] w-full max-w-[180px] shrink-0 rounded-2xl object-cover object-top shadow-soft sm:max-w-[200px]"
              />
              <div>
                <h3 className="font-display text-[21px] font-semibold tracking-display text-ink">
                  Isaac Rodríguez, fisioterapeuta titulado
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-muted">
                  Trato cercano y preciso, con formación académica sólida y experiencia en deporte
                  de alto rendimiento: fútbol de Primera División Femenina, boxeo y competición.
                </p>
                <motion.div
                  className="mt-5 flex flex-wrap gap-2"
                  variants={staggerParent}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                >
                  {CREDENCIALES.map(({ icon: Icon, texto }) => (
                    <motion.div
                      key={texto}
                      variants={staggerItem}
                      className="flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-ink-soft"
                    >
                      <Icon size={13} strokeWidth={2} className="shrink-0 text-sage-600" />
                      {texto}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </Reveal>

          {/* Tarjeta: diploma / credencial visual */}
          <Reveal delay={0.05}>
            <div className="group relative h-full min-h-[180px] overflow-hidden rounded-3xl border border-line shadow-softer">
              <img
                src={diplomaGrado}
                alt="Diploma de Grado en Fisioterapia, Universidad Francisco de Vitoria"
                className="h-full w-full object-cover object-[50%_25%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[13px] font-semibold text-white">Grado en Fisioterapia</p>
                <p className="text-[12px] text-white/75">Universidad Francisco de Vitoria</p>
              </div>
            </div>
          </Reveal>

          {/* Tarjeta: resultado inmediato */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-line bg-ink p-6 shadow-softer">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Activity size={18} strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">Diagnóstico en la misma sesión</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                  Nada de listas de espera de radiología: vemos la lesión contigo, en directo, con
                  el ecógrafo de consulta.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CÓMO FUNCIONA ================= */}
      <section className="border-y border-line bg-canvas-sunken/60">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
          <Reveal className="mx-auto mb-14 max-w-xl text-center">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="mt-4 font-display text-[30px] font-semibold tracking-display text-ink sm:text-[36px]">
              De la reserva al alivio, en tres pasos
            </h2>
          </Reveal>

          <motion.div
            className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
          >
            {PASOS.map(({ numero, icon: Icon, titulo, texto }, i) => (
              <motion.div key={numero} variants={staggerItem} className="relative">
                <div className="flex h-full flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-softer">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-50 text-sage-700">
                      <Icon size={19} strokeWidth={1.9} />
                    </span>
                    <span className="font-display text-[26px] font-semibold text-line-strong">{numero}</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">{titulo}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{texto}</p>
                  </div>
                </div>
                {i < PASOS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-1/2 -right-6 hidden h-px w-6 -translate-y-1/2 bg-line-strong sm:block"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= SERVICIOS ================= */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 lg:px-8 lg:py-28">
        <Reveal className="mx-auto mb-10 max-w-xl text-center lg:mb-14">
          <Eyebrow>Servicios</Eyebrow>
          <h2 className="mt-4 font-display text-[30px] font-semibold tracking-display text-ink sm:text-[36px]">
            Elige tu sesión
          </h2>
          <p className="mt-3 text-[14.5px] text-ink-muted">Resérvala en menos de un minuto, sin llamadas.</p>
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
          <Reveal className="mt-8 flex justify-center">
            <Button as={Link} to="/reservar" variant="accent">
              Ver horarios disponibles
            </Button>
          </Reveal>
        )}
      </section>

      {/* ================= ECOGRAFÍA (a pantalla completa) ================= */}
      <section className="border-y border-line bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <Reveal className="grid grid-cols-2 gap-3.5 lg:order-2">
            <img
              src={ecoConsulta}
              alt="Fisioterapeuta explicando una imagen de ecografía al paciente"
              className="aspect-[4/5] w-full translate-y-6 rounded-2xl object-cover shadow-raised"
            />
            <img
              src={ecoVascular}
              alt="Estudio ecográfico en consulta con doble monitor"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-raised"
            />
          </Reveal>

          <div className="lg:order-1">
            <Reveal>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-medium text-sage-300">
                Diagnóstico por imagen
              </span>
              <h2 className="mb-4 mt-4 font-display text-[30px] font-semibold tracking-display text-white sm:text-[34px]">
                Ecografía musculoesquelética en la misma consulta
              </h2>
              <p className="max-w-md text-[15px] leading-relaxed text-white/60">
                Localizamos la lesión en tiempo real y ajustamos el tratamiento en el momento, sin
                desplazamientos ni listas de espera.
              </p>
            </Reveal>
            <motion.ul
              className="mt-8 flex flex-col gap-5"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {VENTAJAS.map(({ icon: Icon, titulo, texto }) => (
                <motion.li key={titulo} variants={staggerItem} className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage-300">
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{titulo}</p>
                    <p className="text-[13px] text-white/55">{texto}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <Reveal delay={0.15}>
              <Button as={Link} to="/reservar" variant="invert" className="mt-8">
                Reservar valoración con ecografía
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <Reveal className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-28" y={30}>
        <div className="relative overflow-hidden rounded-[32px] bg-sage-700 px-7 py-14 text-center shadow-raised sm:px-12 lg:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.10),transparent_70%)]"
          />
          <h2 className="mx-auto max-w-lg font-display text-[32px] font-semibold leading-[1.1] tracking-display text-white sm:text-[40px]">
            ¿Listo para moverte mejor?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[15px] text-sage-50">
            Reserva tu cita en menos de un minuto, sin llamadas ni esperas.
          </p>
          <Button as={Link} to="/reservar" variant="invert" size="lg" className="relative mt-8">
            Reservar cita
            <ArrowRight size={16} strokeWidth={2.2} />
          </Button>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
