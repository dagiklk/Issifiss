import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Search,
  Presentation,
  History,
  GraduationCap,
  Stethoscope,
  Check,
  ArrowRight,
  CalendarCheck2,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import Button from "../components/admin/ui/Button.jsx";
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
function Reveal({ children, delay = 0, y = 18, className }) {
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
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

// Etiqueta reutilizada como "eyebrow" editorial encima de cada titular de
// sección — la misma pastilla sage-50 en todas partes da consistencia visual
// sin depender de color adicional.
function Eyebrow({ children, dark }) {
  return (
    <span
      className={
        dark
          ? "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-sage-300"
          : "inline-flex items-center rounded-full bg-sage-50 px-3 py-1 text-[12px] font-medium text-sage-700"
      }
    >
      {children}
    </span>
  );
}

// Blob de fondo, difuminado, reutilizado como "decoración" detrás de varias
// secciones para dar sensación de profundidad sin recurrir a gradientes
// llamativos: un único color a muy baja opacidad y mucho blur.
function GlowOrb({ className }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

export default function Home() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], [0, 28]);

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
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Malla de fondo: dos manchas de color muy suaves y difuminadas, en vez
            de un gradiente plano — es lo que da el aire "2026" sin ser ruidoso. */}
        <GlowOrb className="-left-24 -top-32 h-[420px] w-[420px] bg-sage-200/40" />
        <GlowOrb className="-right-32 top-10 h-[380px] w-[380px] bg-sage-100/70" />
        {/*
          Orden deliberado de los 3 bloques (título, foto, botones) por DOM,
          no por className: en móvil (grid-cols-1) se apilan tal cual en ese
          orden — título → foto → botones —, y en desktop la foto recibe
          lg:row-span-2, así que el auto-placement de grid la manda a la
          columna derecha ocupando las dos filas, mientras el título y los
          botones quedan apilados en la izquierda (mismo resultado visual de
          antes, sin depender de "order-*").
        */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 px-4 pb-8 pt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-16 lg:pt-14">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Eyebrow>Fisioterapia deportiva y rehabilitación</Eyebrow>
            <h1 className="mt-4 font-display text-[32px] font-semibold leading-[1.08] tracking-display text-ink sm:text-[40px] lg:text-[44px]">
              Recupera tu <span className="text-sage-600">movimiento</span>, a tu ritmo.
            </h1>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
              Sesiones personalizadas con ecografía diagnóstica incluida en consulta. Reserva
              online en menos de un minuto.
            </p>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[210px] sm:max-w-[300px] lg:max-w-none lg:row-span-2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            style={{ y: heroImgY }}
          >
            <div className="relative">
              {/* Resplandor difuminado justo detrás de la imagen: efecto de
                  "glow" sutil, coherente con el resto de la malla de fondo. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-sage-200/50 blur-2xl"
              />
              <img
                src={isaacPerfil}
                alt="Isaac Rodríguez, fisioterapeuta"
                className="aspect-[4/5] w-full rounded-[24px] object-cover object-top shadow-raised"
              />
              {/* Insignias flotantes: solo desde sm — en el tamaño reducido de
                  móvil no caben sin verse apretadas. */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
                className="absolute -bottom-4 left-5 right-auto hidden w-64 items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur-md sm:flex"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage-700">
                  <GraduationCap size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">Isaac Rodríguez</p>
                  <p className="truncate text-[11.5px] text-ink-muted">Fisioterapeuta titulado, UFV</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -8, x: 8 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
                className="absolute -top-4 -right-3 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3.5 py-2.5 shadow-soft backdrop-blur-md lg:flex"
              >
                <Check size={15} strokeWidth={2.6} className="text-sage-600" />
                <p className="whitespace-nowrap text-[12px] font-semibold text-ink">Cita en &lt;1 min</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          >
            <Button as={Link} to="/reservar" variant="accent" size="lg">
              Reservar cita
              <ArrowRight size={16} strokeWidth={2.2} />
            </Button>
            <Button as="a" href="#servicios" variant="secondary" size="lg">
              Ver servicios
            </Button>
          </motion.div>
        </div>

        {/* Franja de confianza: cierra el hero con hechos concretos, sin relleno */}
        <div className="relative border-y border-line bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 lg:px-8">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-9 sm:gap-y-2">
              {TRUST_STRIP.map(({ icon: Icon, texto }) => (
                <div key={texto} className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
                  <Icon size={14} strokeWidth={2.1} className="shrink-0 text-sage-600" />
                  {texto}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CÓMO FUNCIONA ================= */}
      <section className="relative overflow-hidden border-y border-line bg-canvas-sunken/60">
        <GlowOrb className="left-1/2 top-0 h-[360px] w-[600px] -translate-x-1/2 bg-sage-100/60" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20">
          <Reveal className="mx-auto mb-10 max-w-xl text-center">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="mt-3 font-display text-[23px] font-semibold tracking-display text-ink sm:text-[27px]">
              De la reserva al alivio, en tres pasos
            </h2>
          </Reveal>

          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
          >
            {PASOS.map(({ numero, icon: Icon, titulo, texto }, i) => (
              <motion.div key={numero} variants={staggerItem} className="relative">
                <div className="flex h-full flex-col gap-3.5 rounded-3xl border border-line bg-white/90 p-5 shadow-softer backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-50 text-sage-700">
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span className="font-display text-[22px] font-semibold text-line-strong">{numero}</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{titulo}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{texto}</p>
                  </div>
                </div>
                {i < PASOS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-1/2 -right-5 hidden h-px w-5 -translate-y-1/2 bg-line-strong sm:block"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= SERVICIOS ================= */}
      <section id="servicios" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 lg:px-8 lg:py-20">
        <Reveal className="mx-auto mb-8 max-w-xl text-center lg:mb-10">
          <Eyebrow>Servicios</Eyebrow>
          <h2 className="mt-3 font-display text-[23px] font-semibold tracking-display text-ink sm:text-[27px]">
            Elige tu sesión
          </h2>
          <p className="mt-2.5 text-[13.5px] text-ink-muted">Resérvala en menos de un minuto, sin llamadas.</p>
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

      {/* ================= ECOGRAFÍA (a pantalla completa) ================= */}
      <section className="relative overflow-hidden border-y border-line bg-ink">
        <GlowOrb className="-left-20 top-1/3 h-[420px] w-[420px] bg-sage-500/10" />
        <GlowOrb className="right-0 -bottom-20 h-[320px] w-[320px] bg-sage-400/10" />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
          <Reveal className="grid grid-cols-2 gap-3 lg:order-2">
            <img
              src={ecoConsulta}
              alt="Fisioterapeuta explicando una imagen de ecografía al paciente"
              className="aspect-[4/5] w-full translate-y-5 rounded-2xl object-cover shadow-raised"
            />
            <img
              src={ecoVascular}
              alt="Estudio ecográfico en consulta con doble monitor"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-raised"
            />
          </Reveal>

          <div className="lg:order-1">
            <Reveal>
              <Eyebrow dark>Diagnóstico por imagen</Eyebrow>
              <h2 className="mb-3 mt-3 font-display text-[23px] font-semibold tracking-display text-white sm:text-[27px]">
                Ecografía musculoesquelética en la misma consulta
              </h2>
              <p className="max-w-md text-[14px] leading-relaxed text-white/60">
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage-300">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">{titulo}</p>
                    <p className="text-[12.5px] text-white/55">{texto}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <Reveal delay={0.15}>
              <Button as={Link} to="/reservar" variant="invert" className="mt-7">
                Reservar valoración con ecografía
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <Reveal className="mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20" y={24}>
        <div className="relative overflow-hidden rounded-[28px] bg-sage-700 px-6 py-11 text-center shadow-raised sm:px-10 lg:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]"
          />
          <GlowOrb className="-left-10 -bottom-16 h-56 w-56 bg-white/10" />
          <h2 className="relative mx-auto max-w-lg font-display text-[26px] font-semibold leading-[1.12] tracking-display text-white sm:text-[32px]">
            ¿Listo para moverte mejor?
          </h2>
          <p className="relative mx-auto mt-2.5 max-w-sm text-[14px] text-sage-50">
            Reserva tu cita en menos de un minuto, sin llamadas ni esperas.
          </p>
          <Button as={Link} to="/reservar" variant="invert" size="lg" className="relative mt-7">
            Reservar cita
            <ArrowRight size={16} strokeWidth={2.2} />
          </Button>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
