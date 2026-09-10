import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Mail, Phone, CalendarPlus, UserX, Pencil } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Avatar from "../../components/admin/ui/Avatar.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Sheet from "../../components/admin/ui/Sheet.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";
import AppointmentCard from "../../components/admin/appointments/AppointmentCard.jsx";
import AppointmentDetail from "../../components/admin/appointments/AppointmentDetail.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { patientFullName } from "../../lib/clinicData.js";
import { formatDateWithYear } from "../../utils/dateHelpers.js";

function InfoRow({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] text-ink-soft">
      <Icon size={15} strokeWidth={1.8} className="shrink-0 text-ink-faint" />
      <span className="truncate">{value}</span>
    </div>
  );
}

export default function PacienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pacientes, getByPaciente, getProxima, updateStatus, actualizarNotasPaciente } = useAppointments();
  const [openCita, setOpenCita] = useState(null);
  const [editNotas, setEditNotas] = useState(false);
  const [notas, setNotas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const paciente = pacientes.find((p) => p.id === id);

  const historial = useMemo(() => (paciente ? getByPaciente(paciente.id) : []), [paciente, getByPaciente]);
  const proxima = paciente ? getProxima(paciente.id) : null;

  if (!paciente) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Paciente" back={-1} />
        <EmptyState icon={UserX} title="Paciente no encontrado" description="Puede que el enlace ya no sea válido." />
      </div>
    );
  }

  async function guardarNotas() {
    setSavingNotas(true);
    try {
      await actualizarNotasPaciente(paciente.id, notas);
      toast.success("Notas guardadas");
      setEditNotas(false);
    } catch (err) {
      toast.error(err.message || "No se pudieron guardar las notas.");
    } finally {
      setSavingNotas(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader title={patientFullName(paciente)} back="/admin/pacientes" />

      <div className="px-4 lg:px-8">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <Avatar name={patientFullName(paciente)} size="xl" />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-[18px] font-semibold tracking-display text-ink">{patientFullName(paciente)}</h2>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Paciente desde {paciente.fechaAlta ? formatDateWithYear(paciente.fechaAlta) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-line pt-4 sm:grid-cols-2">
            <InfoRow icon={Phone} value={paciente.telefono} />
            <InfoRow icon={Mail} value={paciente.email} />
          </div>

          <div className="mt-5 flex gap-2.5">
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate("/admin/citas/nueva", { state: { pacienteId: paciente.id } })}
            >
              <CalendarPlus size={15} strokeWidth={2.2} className="-ml-0.5" />
              Agendar cita
            </Button>
            {paciente.telefono && (
              <Button variant="secondary" size="sm" as="a" href={`tel:${paciente.telefono.replace(/\s/g, "")}`}>
                <Phone size={14} strokeWidth={2.2} className="-ml-0.5" />
                Llamar
              </Button>
            )}
          </div>
        </Card>
      </div>

      {proxima && (
        <div className="mt-5 px-4 lg:px-8">
          <p className="mb-2 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Próxima cita</p>
          <AppointmentCard cita={proxima} onClick={() => setOpenCita(proxima)} />
        </div>
      )}

      <div className="mt-5 px-4 lg:px-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Notas clínicas</p>
          {!editNotas && (
            <button
              onClick={() => {
                setNotas(paciente.notasGenerales || "");
                setEditNotas(true);
              }}
              className="flex items-center gap-1 text-[12.5px] font-medium text-sage-600"
            >
              <Pencil size={13} strokeWidth={2} />
              Editar
            </button>
          )}
        </div>
        {editNotas ? (
          <Card className="p-3.5">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Notas generales del paciente…"
              className="w-full resize-none rounded-xl border border-line bg-canvas-sunken/60 p-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:bg-white"
            />
            <div className="mt-2.5 flex gap-2">
              <Button variant="accent" size="sm" disabled={savingNotas} onClick={guardarNotas}>
                {savingNotas ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditNotas(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-3.5">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
              {paciente.notasGenerales || "Sin notas todavía."}
            </p>
          </Card>
        )}
      </div>

      <div className="mt-5 px-4 lg:px-8">
        <p className="mb-2 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">
          Historial de citas ({historial.length})
        </p>
        {historial.length === 0 ? (
          <EmptyState icon={Calendar} title="Sin citas todavía" description="Este paciente aún no tiene citas registradas." />
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((c) => (
              <AppointmentCard key={c.id} cita={c} onClick={() => setOpenCita(c)} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!openCita} onOpenChange={(v) => !v && setOpenCita(null)} title="Detalle de la cita">
        {openCita && <AppointmentDetail cita={openCita} onClose={() => setOpenCita(null)} onStatusChange={updateStatus} />}
      </Sheet>
    </div>
  );
}
