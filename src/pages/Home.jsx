import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Search,
  Presentation,
  History,
  GraduationCap,
  Dumbbell,
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
  { icon: CalendarCheck2, texto: "Confirmación por email" },
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

// Etiqueta "eyebrow" editorial encima de cada titular de sección. "solid" es
// la variante sólida en negro usada solo en el hero (más peso visual que la
// pastilla brand-50 del resto de secciones).
function Eyebrow({ children, dark, solid }) {
  return (
    <span
      className={
        solid
          ? "inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white"
          : dark
          ? "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-brand-300"
          : "inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-700"
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
  // "-z-10": position:absolute por sí solo ya pinta por encima de cualquier
  // contenido estático del mismo section (así sea, precede en el DOM), así
  // que sin esto el halo tapaba el titular en vez de quedar detrás.
  return <div aria-hidden className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${className}`} />;
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
        <GlowOrb className="-left-24 -top-32 h-[420px] w-[420px] bg-brand-200/40" />
        <GlowOrb className="-right-32 top-10 h-[380px] w-[380px] bg-brand-100/70" />
        {/*
          Orden deliberado de los 3 bloques (título, foto, botones) por DOM,
          no por className: en móvil (grid-cols-1) se apilan tal cual en ese
          orden — título → foto → botones —, y en desktop la foto recibe
          lg:row-span-2, así que el auto-placement de grid la manda a la
          columna derecha ocupando las dos filas, mientras el título y los
          botones quedan apilados en la izquierda (mismo resultado visual de
          antes, sin depender de "order-*").
        */}
        {/*
          La foto se renderiza dos veces a propósito (misma imagen, mismo
          "src" → el navegador no la vuelve a descargar): una en el flujo de
          la columna izquierda, visible solo <lg y colocada entre el
          subtítulo y los botones; otra como columna derecha, visible solo
          en lg+. Con dos columnas simples (sin row-span) cada una mide solo
          lo que su propio contenido necesita.
        */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 px-4 pb-8 pt-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Eyebrow solid>
                <Dumbbell size={13} strokeWidth={2.4} />
                Fisioterapia deportiva y rehabilitación
              </Eyebrow>
              <h1 className="mt-5 font-archivoBlack text-[42px] font-normal uppercase leading-[0.92] tracking-[-0.02em] text-ink sm:text-[54px] lg:text-[62px]">
                Recupera tu
                <br />
                <span className="text-brand-600">movimiento</span>
              </h1>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
                Reserva online en menos de un minuto.
              </p>
            </motion.div>

            {/* Foto — solo en móvil/tablet, aquí entre el subtítulo y los botones */}
            <motion.div
              className="relative mx-auto w-full max-w-[210px] sm:max-w-[260px] lg:hidden"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-brand-200/50 blur-2xl"
              />
              <img
                src={isaacPerfil}
                alt="Isaac Rodríguez, fisioterapeuta"
                className="aspect-[4/5] w-full rounded-[24px] border-2 border-ink object-cover object-top shadow-raised"
              />
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              <Button as={Link} to="/reservar" variant="primary" size="md">
                <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">Reservar cita</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </Button>
              <Button as="a" href="#servicios" variant="secondary" size="md">
                <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">Ver servicios</span>
              </Button>
            </motion.div>
          </div>

          {/* Foto — solo en escritorio (lg+), columna derecha con las insignias */}
          <motion.div
            className="relative mx-auto hidden w-full max-w-[420px] lg:block"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            style={{ y: heroImgY }}
          >
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-brand-200/50 blur-2xl"
              />
              <img
                src={isaacPerfil}
                alt="Isaac Rodríguez, fisioterapeuta"
                className="aspect-[4/5] w-full rounded-[24px] border-2 border-ink object-cover object-top shadow-raised"
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
                className="absolute -bottom-4 left-5 flex w-64 items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-raised"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                  <GraduationCap size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink">Isaac Rodríguez</p>
                  <p className="truncate text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-muted">
                    Fisioterapeuta titulado, UFV
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -8, x: 8 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
                className="absolute -top-4 -right-3 flex items-center gap-2 rounded-2xl border-2 border-ink bg-brand-600 px-3.5 py-2.5 shadow-raised"
              >
                <Check size={15} strokeWidth={2.8} className="text-white" />
                <p className="whitespace-nowrap text-[11.5px] font-bold uppercase tracking-[0.04em] text-white">
                  Cita en &lt;1 min
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Franja de confianza: cierra el hero con hechos concretos, sin relleno */}
        <div className="relative border-y-2 border-ink bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 lg:px-8">
            <div className="flex flex-col divide-y divide-ink/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:divide-x sm:divide-y-0">
              {TRUST_STRIP.map(({ icon: Icon, texto }) => (
                <div
                  key={texto}
                  className="flex items-center gap-2 py-2 text-[12px] font-bold uppercase tracking-[0.03em] text-ink sm:px-6 sm:py-0"
                >
                  <Icon size={14} strokeWidth={2.2} className="shrink-0 text-brand-600" />
                  {texto}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CÓMO FUNCIONA ================= */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-canvas-sunken/60">
        <GlowOrb className="left-1/2 top-0 h-[360px] w-[600px] -translate-x-1/2 bg-brand-100/60" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20">
          <Reveal className="mx-auto mb-10 max-w-xl text-center">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="mt-3 font-archivoBlack text-[26px] font-normal uppercase tracking-[-0.01em] text-ink sm:text-[32px]">
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
                <div className="flex h-full flex-col gap-3.5 rounded-2xl border-2 border-ink bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-raised">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span className="font-archivoBlack text-[28px] font-normal leading-none text-ink/15">{numero}</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-ink">{titulo}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{texto}</p>
                  </div>
                </div>
                {i < PASOS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-1/2 -right-5 hidden h-px w-5 -translate-y-1/2 bg-ink/20 sm:block"
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
          <h2 className="mt-3 font-archivoBlack text-[26px] font-normal uppercase tracking-[-0.01em] text-ink sm:text-[32px]">
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
          {servicios.map((servicio) => {
            const destacado = servicio.nombre?.trim().toLowerCase().startsWith(SERVICIO_DESTACADO);
            return (
              <motion.button
                key={servicio.id}
                type="button"
                variants={staggerItem}
                onClick={() => navigate("/reservar", { state: { servicioId: servicio.id } })}
                className={
                  "group relative flex flex-col gap-2 rounded-2xl border-2 bg-white p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised active:scale-[0.985] " +
                  (destacado ? "border-brand-500 hover:border-brand-600" : "border-ink/12 hover:border-ink")
                }
              >
                {destacado && (
                  <span className="absolute -top-2.5 left-4 rounded-md bg-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    Recomendada
                  </span>
                )}
                <h3 className="text-[16px] font-bold text-ink">{servicio.nombre}</h3>
                {servicio.descripcion && (
                  <p className="text-[13px] leading-relaxed text-ink-muted">{servicio.descripcion}</p>
                )}
                <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
                  {servicio.precio != null && (
                    <span className="font-archivoBlack text-[22px] font-normal tabular-nums text-ink">
                      {Number(servicio.precio).toFixed(0)} €
                    </span>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                    {servicio.duracion_minutos} min
                  </span>
                </div>
              </motion.button>
            );
          })}
          {servicios.length === 0 && (
            <p className="col-span-full py-6 text-center text-[13.5px] text-ink-faint">
              Todavía no hay servicios configurados. Añádelos en la tabla "servicios" de Supabase.
            </p>
          )}
        </motion.div>
        {servicios.length > 0 && (
          <Reveal className="mt-7 flex justify-center">
            <Button as={Link} to="/reservar" variant="primary">
              <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">Ver horarios disponibles</span>
            </Button>
          </Reveal>
        )}
      </section>

      {/* ================= ECOGRAFÍA (a pantalla completa) ================= */}
      <section className="relative overflow-hidden border-y-2 border-ink bg-ink">
        <GlowOrb className="-left-20 top-1/3 h-[420px] w-[420px] bg-brand-500/10" />
        <GlowOrb className="right-0 -bottom-20 h-[320px] w-[320px] bg-brand-400/10" />
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
              <h2 className="mb-3 mt-3 font-archivoBlack text-[26px] font-normal uppercase leading-[1] tracking-[-0.01em] text-white sm:text-[32px]">
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold text-white">{titulo}</p>
                    <p className="text-[12.5px] text-white/55">{texto}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <Reveal delay={0.15}>
              <Button as={Link} to="/reservar" variant="invert" className="mt-7">
                <span className="text-[12.5px] font-bold uppercase tracking-[0.08em]">
                  Reservar valoración con ecografía
                </span>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <Reveal className="mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20" y={24}>
        <div className="relative overflow-hidden rounded-[28px] border-2 border-ink bg-brand-700 px-6 py-11 text-center shadow-raised sm:px-10 lg:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]"
          />
          <GlowOrb className="-left-10 -bottom-16 h-56 w-56 bg-white/10" />
          <h2 className="relative mx-auto max-w-lg font-archivoBlack text-[30px] font-normal uppercase leading-[0.98] tracking-[-0.02em] text-white sm:text-[38px]">
            ¿Listo para moverte mejor?
          </h2>
          <p className="relative mx-auto mt-2.5 max-w-sm text-[14px] text-brand-50">
            Reserva tu cita en menos de un minuto, sin llamadas ni esperas.
          </p>
          <Button as={Link} to="/reservar" variant="invert" size="lg" className="relative mt-7">
            <span className="text-[13px] font-bold uppercase tracking-[0.08em]">Reservar cita</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </Button>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
