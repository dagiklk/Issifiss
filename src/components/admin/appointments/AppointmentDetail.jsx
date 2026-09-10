import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { patientFullName } from "../../../lib/clinicData.js";
import { formatLongDate } from "../../../utils/dateHelpers.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas-sunken text-ink-muted">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] text-ink-faint">{label}</p>
        <p className="truncate text-[14px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function AppointmentDetail({ cita, onClose, onStatusChange }) {
  const navigate = useNavigate();
  const { updateNotas } = useAppointments();
  const [nota, setNota] = useState(cita.notas || "");
  const [savingNota, setSavingNota] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const { paciente, tratamiento } = cita;

  async function updateStatus(next, message) {
    setSavingEstado(true);
    try {
      await onStatusChange?.(cita.id, next);
      toast.success(message);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar la cita.");
    } finally {
      setSavingEstado(false);
    }
  }

  async function guardarNota() {
    setSavingNota(true);
    try {
      await updateNotas(cita.id, nota);
      toast.success("Nota guardada");
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la nota.");
    } finally {
      setSavingNota(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          onClose?.();
          navigate(`/admin/pacientes/${paciente.id}`);
        }}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-canvas-sunken p-3 text-left transition-transform duration-150 active:scale-[0.985]"
      >
        <Avatar name={patientFullName(paciente)} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{patientFullName(paciente)}</p>
          <p className="text-[12.5px] text-ink-muted">Ver ficha del paciente</p>
        </div>
        <StatusBadge status={cita.estado} />
      </button>

      <div className="divide-y divide-line">
        <Row icon={Calendar} label="Fecha" value={formatLongDate(cita.fecha)} />
        <Row icon={Clock} label="Hora" value={`${cita.horaInicio} – ${cita.horaFin} · ${cita.duracionMin} min`} />
        <Row icon={Stethoscope} label="Tipo de sesión" value={tratamiento?.nombre} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Notas de la sesión</label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Sin notas todavía…"
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-canvas-sunken/60 p-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:bg-white"
        />
        {nota !== (cita.notas || "") && (
          <Button variant="secondary" size="sm" className="mt-2" disabled={savingNota} onClick={guardarNota}>
            {savingNota ? "Guardando…" : "Guardar nota"}
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {cita.estado === "pendiente" && (
          <Button variant="accent" block disabled={savingEstado} onClick={() => updateStatus("confirmada", "Cita confirmada")}>
            Confirmar cita
          </Button>
        )}
        {cita.estado === "confirmada" && (
          <Button variant="accent" block disabled={savingEstado} onClick={() => updateStatus("completada", "Marcada como completada")}>
            Marcar como completada
          </Button>
        )}
        {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
          <Button variant="danger" block disabled={savingEstado} onClick={() => updateStatus("cancelada", "Cita cancelada")}>
            Cancelar cita
          </Button>
        )}
        {cita.estado === "cancelada" && (
          <Button variant="secondary" block disabled={savingEstado} onClick={() => updateStatus("pendiente", "Cita reactivada")}>
            Reactivar cita
          </Button>
        )}
      </div>
    </div>
  );
}
