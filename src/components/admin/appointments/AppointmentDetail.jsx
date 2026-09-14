import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Pencil, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import DateStrip from "./DateStrip.jsx";
import TimeSlotPicker from "./TimeSlotPicker.jsx";
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
  const { updateNotas, reprogramarCita } = useAppointments();
  const [nota, setNota] = useState(cita.notas || "");
  const [savingNota, setSavingNota] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const { paciente, tratamiento } = cita;

  const [editandoFecha, setEditandoFecha] = useState(false);
  const [editFecha, setEditFecha] = useState(cita.fecha);
  const [editHora, setEditHora] = useState(cita.horaInicio);
  const [savingFecha, setSavingFecha] = useState(false);
  const puedeReprogramar = cita.estado === "pendiente" || cita.estado === "confirmada";
  const cambioSinGuardar = editFecha !== cita.fecha || editHora !== cita.horaInicio;

  function abrirEdicionFecha() {
    setEditFecha(cita.fecha);
    setEditHora(cita.horaInicio);
    setEditandoFecha(true);
  }

  function cancelarEdicionFecha() {
    setEditFecha(cita.fecha);
    setEditHora(cita.horaInicio);
    setEditandoFecha(false);
  }

  async function guardarNuevaFechaHora() {
    if (!cambioSinGuardar) {
      setEditandoFecha(false);
      return;
    }
    setSavingFecha(true);
    try {
      await reprogramarCita(cita.id, { fecha: editFecha, horaInicio: editHora });
      toast.success("Cita reprogramada");
      setEditandoFecha(false);
    } catch (err) {
      toast.error(err.message || "No se pudo cambiar la fecha/hora.");
    } finally {
      setSavingFecha(false);
    }
  }

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
        {!editandoFecha && (
          <div className="flex items-center gap-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas-sunken text-ink-muted">
              <Calendar size={16} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] text-ink-faint">Fecha y hora</p>
              <p className="truncate text-[14px] font-medium text-ink">
                {formatLongDate(cita.fecha)} · {cita.horaInicio} – {cita.horaFin}
              </p>
            </div>
            {puedeReprogramar && (
              <button
                onClick={abrirEdicionFecha}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-sage-700 hover:bg-sage-50"
              >
                <Pencil size={13} strokeWidth={1.8} />
                Cambiar
              </button>
            )}
          </div>
        )}
        <Row icon={Stethoscope} label="Tipo de sesión" value={tratamiento?.nombre} />
      </div>

      {editandoFecha && (
        <div className="mt-3 rounded-2xl border border-line bg-canvas-sunken/40 p-3">
          <p className="mb-2 text-[12.5px] font-medium text-ink-muted">Elige la nueva fecha y hora</p>
          <DateStrip selected={editFecha} onSelect={(iso) => { setEditFecha(iso); setEditHora(null); }} daysBefore={0} daysAfter={30} />
          <div className="mt-3 px-1">
            <TimeSlotPicker
              fecha={editFecha}
              duracionMin={tratamiento?.duracionMin || cita.duracionMin}
              value={editHora}
              onChange={setEditHora}
              excludeCitaId={cita.id}
            />
          </div>
          <div className="mt-2 flex gap-2 px-1">
            <Button variant="secondary" size="sm" disabled={savingFecha} onClick={cancelarEdicionFecha}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={savingFecha || !editHora || !cambioSinGuardar}
              onClick={guardarNuevaFechaHora}
            >
              {savingFecha ? "Guardando…" : "Guardar nuevo horario"}
            </Button>
          </div>
        </div>
      )}

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
        {cita.estado === "confirmada" && (
          <Button
            variant="secondary"
            block
            disabled={savingEstado}
            onClick={() => updateStatus("no_asistio", "Marcada como no asistida")}
          >
            El cliente no asistió
          </Button>
        )}
        {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
          <Button variant="danger" block disabled={savingEstado} onClick={() => updateStatus("cancelada", "Cita cancelada")}>
            Cancelar cita
          </Button>
        )}
        {(cita.estado === "cancelada" || cita.estado === "no_asistio") && (
          <Button variant="secondary" block disabled={savingEstado} onClick={() => updateStatus("pendiente", "Cita reactivada")}>
            Reactivar cita
          </Button>
        )}
      </div>
    </div>
  );
}
