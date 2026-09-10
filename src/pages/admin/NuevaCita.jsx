import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, UserPlus } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Stepper from "../../components/admin/ui/Stepper.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Avatar from "../../components/admin/ui/Avatar.jsx";
import SearchInput from "../../components/admin/ui/SearchInput.jsx";
import DateStrip from "../../components/admin/appointments/DateStrip.jsx";
import TimeSlotPicker from "../../components/admin/appointments/TimeSlotPicker.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { patientFullName } from "../../lib/clinicData.js";
import { capitalize, formatLongDate, toISODate } from "../../utils/dateHelpers.js";

const STEPS = ["Paciente", "Tratamiento", "Fecha", "Hora", "Confirmación"];

export default function NuevaCita() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pacientes, servicios, crearCita } = useAppointments();
  const prefill = location.state || {};

  const [step, setStep] = useState(0);
  const [pacienteId, setPacienteId] = useState(prefill.pacienteId || null);
  const [servicioId, setServicioId] = useState(null);
  const [fecha, setFecha] = useState(prefill.fecha || toISODate(new Date()));
  const [hora, setHora] = useState(prefill.hora || null);
  const [query, setQuery] = useState("");
  const [nuevoPaciente, setNuevoPaciente] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [telefonoNuevo, setTelefonoNuevo] = useState("");
  const [emailNuevo, setEmailNuevo] = useState("");
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const paciente = nuevoPaciente || pacientes.find((p) => p.id === pacienteId);
  const tratamiento = servicios.find((s) => s.id === servicioId);

  const patientResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 8);
    return pacientes.filter((p) => patientFullName(p).toLowerCase().includes(q));
  }, [query, pacientes]);

  const canNext = [!!paciente, !!tratamiento, !!fecha, !!hora, true][step];

  function next() {
    if (step === STEPS.length - 1) return confirm();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    if (step === 0) return navigate(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function confirm() {
    setSubmitting(true);
    try {
      const cita = await crearCita({
        pacienteId: nuevoPaciente ? null : pacienteId,
        nuevoPaciente: nuevoPaciente
          ? { nombre: nuevoPaciente.nombre, telefono: nuevoPaciente.telefono, email: nuevoPaciente.email }
          : null,
        servicioId: tratamiento.id,
        fecha,
        horaInicio: hora,
      });
      toast.success("Cita creada correctamente");
      setDone(cita);
    } catch (err) {
      toast.error(err.message || "No se pudo crear la cita.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-8 pt-[max(3rem,10vh)] text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-50 text-sage-600"
        >
          <Check size={28} strokeWidth={2.4} />
        </motion.div>
        <h1 className="mt-5 font-display text-[22px] font-semibold tracking-display text-ink">Cita confirmada</h1>
        <p className="mt-1.5 text-[14px] text-ink-muted">
          {patientFullName(paciente)} · {capitalize(formatLongDate(fecha))} a las {hora}
        </p>
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button variant="accent" block onClick={() => navigate("/admin/agenda", { state: { fecha } })}>
            Ver en la agenda
          </Button>
          <Button variant="secondary" block onClick={() => navigate("/admin")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-28 lg:pb-8">
      <PageHeader title="Nueva cita" back={back} />
      <Stepper steps={STEPS} current={step} />

      <div className="px-4 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step === 0 && (
              <div>
                <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente por nombre" autoFocus />
                <div className="mt-3 flex flex-col gap-2">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPacienteId(p.id);
                        setNuevoPaciente(null);
                      }}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 active:scale-[0.985] ${
                        pacienteId === p.id ? "border-sage-400 bg-sage-50/60" : "border-line bg-white hover:border-line-strong"
                      }`}
                    >
                      <Avatar name={patientFullName(p)} size="sm" />
                      <span className="flex-1 text-[14px] font-medium text-ink">{patientFullName(p)}</span>
                      {pacienteId === p.id && <Check size={17} strokeWidth={2.4} className="text-sage-600" />}
                    </button>
                  ))}
                  {patientResults.length === 0 && !showNuevo && (
                    <p className="py-4 text-center text-[13px] text-ink-faint">Ningún paciente coincide.</p>
                  )}
                </div>

                {!showNuevo ? (
                  <button
                    onClick={() => setShowNuevo(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-3 text-[13.5px] font-medium text-ink-muted transition-colors hover:border-sage-300 hover:text-sage-700"
                  >
                    <UserPlus size={16} strokeWidth={2} />
                    Paciente nuevo
                  </button>
                ) : (
                  <Card className="mt-3 p-4">
                    <p className="mb-3 text-[13px] font-semibold text-ink">Paciente nuevo</p>
                    <div className="flex flex-col gap-2.5">
                      <input
                        value={nombreNuevo}
                        onChange={(e) => setNombreNuevo(e.target.value)}
                        placeholder="Nombre completo"
                        className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
                      />
                      <input
                        value={telefonoNuevo}
                        onChange={(e) => setTelefonoNuevo(e.target.value)}
                        placeholder="Teléfono"
                        className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
                      />
                      <input
                        value={emailNuevo}
                        onChange={(e) => setEmailNuevo(e.target.value)}
                        placeholder="Email (opcional)"
                        type="email"
                        className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!nombreNuevo.trim()}
                        onClick={() => {
                          setNuevoPaciente({ nombre: nombreNuevo.trim(), telefono: telefonoNuevo.trim(), email: emailNuevo.trim() });
                          setPacienteId(null);
                          setShowNuevo(false);
                        }}
                      >
                        Usar este paciente
                      </Button>
                    </div>
                  </Card>
                )}

                {nuevoPaciente && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sage-400 bg-sage-50/60 p-3">
                    <Avatar name={patientFullName(nuevoPaciente)} size="sm" />
                    <span className="flex-1 text-[14px] font-medium text-ink">{patientFullName(nuevoPaciente)} (nuevo)</span>
                    <Check size={17} strokeWidth={2.4} className="text-sage-600" />
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {servicios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServicioId(s.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.985] ${
                      servicioId === s.id ? "border-sage-400 bg-sage-50/60" : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <span>
                      <span className="block text-[14.5px] font-medium text-ink">{s.nombre}</span>
                      <span className="text-[12.5px] text-ink-muted">
                        {s.duracionMin} min{s.precio ? ` · ${Number(s.precio).toFixed(0)} €` : ""}
                      </span>
                    </span>
                    {servicioId === s.id && <Check size={18} strokeWidth={2.4} className="shrink-0 text-sage-600" />}
                  </button>
                ))}
                {servicios.length === 0 && (
                  <p className="py-4 text-center text-[13px] text-ink-faint">No hay tratamientos activos configurados.</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-3 text-[15px] font-semibold text-ink">{capitalize(formatLongDate(fecha))}</p>
                <DateStrip selected={fecha} onSelect={(f) => { setFecha(f); setHora(null); }} daysBefore={0} daysAfter={30} />
              </div>
            )}

            {step === 3 && <TimeSlotPicker fecha={fecha} duracionMin={tratamiento?.duracionMin} value={hora} onChange={setHora} />}

            {step === 4 && (
              <Card className="p-5">
                <p className="mb-4 text-[13px] font-semibold uppercase tracking-eyebrow text-ink-faint">Resumen</p>
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <Avatar name={patientFullName(paciente)} size="md" />
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{patientFullName(paciente)}</p>
                    {paciente.telefono && <p className="text-[12.5px] text-ink-muted">{paciente.telefono}</p>}
                  </div>
                </div>
                <dl className="mt-4 flex flex-col gap-3 text-[14px]">
                  <div className="flex justify-between"><dt className="text-ink-muted">Tratamiento</dt><dd className="font-medium text-ink">{tratamiento.nombre}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-muted">Fecha</dt><dd className="font-medium text-ink">{capitalize(formatLongDate(fecha))}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-muted">Hora</dt><dd className="font-medium text-ink">{hora} · {tratamiento.duracionMin} min</dd></div>
                  {tratamiento.precio && (
                    <div className="flex justify-between"><dt className="text-ink-muted">Precio</dt><dd className="font-medium text-ink">{Number(tratamiento.precio).toFixed(0)} €</dd></div>
                  )}
                </dl>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-white/90 px-4 py-3 backdrop-blur-xl lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-8 lg:py-0">
        <div className="mx-auto flex max-w-2xl gap-2.5">
          <Button variant="secondary" onClick={back} className="shrink-0" disabled={submitting}>
            <ChevronLeft size={16} strokeWidth={2.2} className="-ml-1" />
            Atrás
          </Button>
          <Button variant="accent" block disabled={!canNext || submitting} onClick={next}>
            {submitting ? "Guardando…" : step === STEPS.length - 1 ? "Confirmar cita" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
