import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Calendar, FileText, Pencil, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import DateStrip from "./DateStrip.jsx";
import TimeSlotPicker from "./TimeSlotPicker.jsx";
import { patientFullName } from "../../../lib/clinicData.js";
import { formatLongDate } from "../../../utils/dateHelpers.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";
import { generarFacturaPdf } from "../../../lib/facturaPdf.js";

const FORMAS_PAGO = [
  { value: "bizum", label: "Bizum" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
];

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
  const { updateNotas, reprogramarCita, generarFactura } = useAppointments();
  const [nota, setNota] = useState(cita.notas || "");
  // null = vista normal; "preguntar"/"pago" = pasos del flujo de factura,
  // que sustituyen el contenido del sheet tras marcar la cita como
  // completada (ver updateStatus más abajo).
  const [pasoFactura, setPasoFactura] = useState(null);
  const [formaPago, setFormaPago] = useState("bizum");
  const [dni, setDni] = useState(cita.paciente?.dni || "");
  const [generandoFactura, setGenerandoFactura] = useState(false);
  // "cita" es una prop fijada al abrir el sheet: no se resincroniza sola con
  // el contexto tras guardar. Sin esta base aparte, comparar contra
  // "cita.notas" (obsoleto) dejaría el botón "Guardar nota" visible para
  // siempre después de guardar con éxito, como si siguiera habiendo cambios
  // sin guardar.
  const [notaGuardada, setNotaGuardada] = useState(cita.notas || "");
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
      // "cita" es una prop fijada al abrir el sheet y no se actualiza sola:
      // sin cerrar aquí, el bloque de fecha/hora de arriba seguiría
      // mostrando el horario ANTIGUO aunque el cambio ya se guardó bien.
      onClose?.();
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
      // Al completar una sesión, en vez de cerrar el sheet directamente se
      // ofrece generar su factura — el cierre queda en manos de esa
      // respuesta (responderPreguntaFactura / generarFacturaYDescargar).
      if (next === "completada") {
        setPasoFactura("preguntar");
      } else {
        onClose?.();
      }
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar la cita.");
    } finally {
      setSavingEstado(false);
    }
  }

  function responderPreguntaFactura(generar) {
    if (!generar) {
      onClose?.();
      return;
    }
    setPasoFactura("pago");
  }

  async function generarFacturaYDescargar() {
    if (!dni.trim()) {
      toast.error("Introduce el DNI/NIF del cliente.");
      return;
    }
    setGenerandoFactura(true);
    try {
      const factura = await generarFactura(cita.id, { formaPago, dni });
      generarFacturaPdf({
        numero: factura.numero,
        fecha: factura.fecha,
        concepto: factura.concepto,
        importe: factura.importe,
        formaPago: factura.forma_pago,
        nombreCliente: factura.nombre_cliente,
        dniCliente: factura.dni_cliente,
      });
      toast.success(`Factura ${factura.numero} generada`);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "No se pudo generar la factura.");
    } finally {
      setGenerandoFactura(false);
    }
  }

  async function guardarNota() {
    setSavingNota(true);
    try {
      await updateNotas(cita.id, nota);
      setNotaGuardada(nota);
      toast.success("Nota guardada");
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la nota.");
    } finally {
      setSavingNota(false);
    }
  }

  if (pasoFactura === "preguntar") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage-600">
          <FileText size={24} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[15px] font-semibold text-ink">Sesión completada</p>
          <p className="mt-1 text-[13.5px] text-ink-muted">¿Quieres generar la factura de esta sesión?</p>
        </div>
        <div className="mt-2 flex w-full gap-2">
          <Button variant="secondary" block onClick={() => responderPreguntaFactura(false)}>
            Ahora no
          </Button>
          <Button variant="accent" block onClick={() => responderPreguntaFactura(true)}>
            Generar factura
          </Button>
        </div>
      </div>
    );
  }

  if (pasoFactura === "pago") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[15px] font-semibold text-ink">Datos de la factura</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Se generará a nombre de {patientFullName(paciente)}.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">DNI/NIF del cliente</label>
          <input
            className="h-11 w-full rounded-xl border border-line bg-canvas-sunken/60 px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:bg-white"
            value={dni}
            onChange={(e) => setDni(e.target.value.toUpperCase())}
            placeholder="12345678A"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Forma de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {FORMAS_PAGO.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormaPago(opt.value)}
                className={clsx(
                  "h-11 rounded-xl border text-[13px] font-medium transition-colors duration-150",
                  formaPago === opt.value
                    ? "border-sage-500 bg-sage-50 text-sage-700"
                    : "border-line text-ink-muted hover:border-line-strong"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1 flex gap-2">
          <Button variant="secondary" block disabled={generandoFactura} onClick={() => setPasoFactura("preguntar")}>
            Atrás
          </Button>
          <Button variant="accent" block disabled={generandoFactura} onClick={generarFacturaYDescargar}>
            {generandoFactura ? "Generando…" : "Generar factura"}
          </Button>
        </div>
      </div>
    );
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
        {nota !== notaGuardada && (
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
