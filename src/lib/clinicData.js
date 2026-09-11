// Real data helpers for the admin UI. Everything here shapes or derives
// values from the live Supabase tables (servicios, pacientes, citas,
// disponibilidad) — nothing in this file is mock/local data.

// ---- Patients -----------------------------------------------------------
// "pacientes" only stores a single "nombre" field (no separate surname),
// so every helper that used to split nombre/apellidos works off that.
export function patientFullName(p) {
  return p?.nombre?.trim() || "Paciente";
}

export function patientInitials(p) {
  const parts = (p?.nombre || "").trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`;
  return (initials || "??").toUpperCase();
}

// ---- Deterministic color for a treatment dot/badge -----------------------
// "servicios" has no color column, so we derive a stable one from its id,
// the same trick Avatar.jsx uses to color patient initials from their name.
const COLORS = ["sage", "amber", "rose"];
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function colorForServicio(id) {
  return COLORS[hashString(id || "") % COLORS.length];
}

// ---- Supabase row -> UI shape adapters -----------------------------------
export function toUiPaciente(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono || "",
    email: row.email || "",
    fechaAlta: row.fecha_alta,
    notasGenerales: row.notas_generales || "",
    consentimientoRgpd: row.consentimiento_rgpd,
  };
}

export function toUiServicio(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: (row.nombre || "").trim(),
    duracionMin: row.duracion_minutos,
    precio: row.precio,
    descripcion: row.descripcion || "",
    color: colorForServicio(row.id),
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}
function hhmm(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toUiCita(row) {
  if (!row) return null;
  const inicio = new Date(row.fecha_hora_inicio);
  const fin = new Date(row.fecha_hora_fin);
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    servicioId: row.servicio_id,
    fecha: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`,
    horaInicio: hhmm(inicio),
    horaFin: hhmm(fin),
    duracionMin: Math.round((fin.getTime() - inicio.getTime()) / 60000),
    estado: row.estado,
    // Precio cobrado en el momento de la reserva — no el precio actual del
    // servicio, que puede haber cambiado desde entonces (ver toUiServicio).
    precio: row.precio ?? row.servicios?.precio ?? null,
    notas: row.notas || "",
    tokenCancelacion: row.token_cancelacion,
    creadoEn: row.creado_en,
    paciente: row.pacientes ? toUiPaciente(row.pacientes) : null,
    tratamiento: row.servicios ? toUiServicio(row.servicios) : null,
  };
}

// ---- Availability slots ---------------------------------------------------
// Mirrors generarSlots() from src/components/SelectorHorario.jsx (the public
// booking flow) so the admin panel offers exactly the same time grid logic.
export function generarSlots(horaInicio, horaFin, duracionMin) {
  if (!horaInicio || !horaFin || !duracionMin) return [];
  const slots = [];
  const [hIni, mIni] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);
  let cursor = hIni * 60 + mIni;
  const fin = hFin * 60 + mFin;
  while (cursor + duracionMin <= fin) {
    slots.push(`${pad(Math.floor(cursor / 60))}:${pad(cursor % 60)}`);
    cursor += duracionMin;
  }
  return slots;
}

export function diaSemanaFromISO(fechaISO) {
  return new Date(`${fechaISO}T00:00:00`).getDay();
}

export function slotsForDia(disponibilidad, diaSemana, duracionMin) {
  const franjas = (disponibilidad || []).filter((f) => f.dia_semana === diaSemana);
  return franjas
    .flatMap((f) => generarSlots(f.hora_inicio.slice(0, 5), f.hora_fin.slice(0, 5), duracionMin))
    .sort();
}

export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
