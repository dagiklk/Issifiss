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

// La duración guardada (duracion_minutos) es la que bloquea el hueco real en
// la agenda — se deja en el máximo (p.ej. 60) para que nunca se quede corta.
// De cara al paciente, sin embargo, se comunica como rango: si la sesión
// dura menos porque el fisio termina antes, no hay problema. Solo se aplica
// a las sesiones "largas" (60 min); las cortas (vendaje, valoración
// ecográfica...) se muestran con su duración exacta, sin rango.
export function formatDuracion(minutos) {
  if (minutos === 60) return "45-60 min";
  return `${minutos} min`;
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

// Minutos desde medianoche de una hora "HH:MM" (o "HH:MM:SS").
export function minutosDesde(horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

// ¿Se solapa el hueco candidato [horaStr, horaStr + duracionMin) con ALGUNA
// de las citas ya ocupadas ese día? "ocupadas" es una lista de intervalos
// {inicio, fin} en minutos (ver horasOcupadas en AppointmentsContext.jsx y
// SelectorHorario.jsx).
//
// Antes, "¿está ocupada esta hora?" comparaba solo la hora de INICIO exacta
// de la cita candidata contra las horas de inicio de las citas existentes.
// Eso falla en cuanto dos servicios tienen duraciones distintas: una cita de
// Fisioterapia Manual (60 min) a las 10:00 ocupa hasta las 11:00, así que un
// Vendaje (20 min) a las 10:20 también debe verse ocupado aunque no
// coincida con ninguna hora de inicio existente — antes se mostraba libre,
// y el paciente solo se enteraba del solape al enviar el formulario, cuando
// el backend ya lo rechazaba con un 409 confuso.
export function seSolapaConOcupadas(ocupadas, horaStr, duracionMin) {
  const inicio = minutosDesde(horaStr);
  const fin = inicio + duracionMin;
  return ocupadas.some((o) => o.inicio < fin && o.fin > inicio);
}

export function diaSemanaFromISO(fechaISO) {
  return new Date(`${fechaISO}T00:00:00`).getDay();
}

export function slotsForDia(disponibilidad, diaSemana, duracionMin) {
  const franjas = (disponibilidad || []).filter((f) => f.dia_semana === diaSemana);
  const slots = franjas.flatMap((f) => generarSlots(f.hora_inicio.slice(0, 5), f.hora_fin.slice(0, 5), duracionMin));
  // Set: si el admin configura dos franjas del mismo día que se solapan
  // (nada lo impide en HorarioEditor.jsx), la misma hora puede salir de más
  // de una franja — sin deduplicar aquí, TimeSlotPicker acaba renderizando
  // botones de hora repetidos con la misma key de React.
  return [...new Set(slots)].sort();
}

export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
