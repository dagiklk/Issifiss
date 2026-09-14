// =====================================================================
// ISSIFISS · Edge Function: reprogramar-cita
// -----------------------------------------------------------------------
// Ruta prevista: supabase/functions/reprogramar-cita/index.ts
// Deploy: supabase functions deploy reprogramar-cita
//
// Por qué existe:
//  Igual que "cancelar-cita", la tabla "citas" no tiene política RLS de
//  UPDATE para "anon" ni para un cliente logueado normal (solo el fisio,
//  vía is_admin() — ver supabase/schema_cuentas_clientes.sql), así que
//  cambiar la fecha/hora de una cita desde la página pública /cancelar
//  tiene que pasar por aquí, con la Service Role Key, igual que la
//  creación y la cancelación.
//
// Qué hace (POST { token, fecha_hora_inicio }):
//  1. Busca la cita por su token_cancelacion (mismo mecanismo que cancelar-cita).
//  2. Solo permite reprogramar citas en estado "pendiente" o "confirmada"
//     (no canceladas/completadas/no_asistio).
//  3. Valida el nuevo horario igual que "crear-cita": que no sea en el
//     pasado, que caiga dentro de la disponibilidad configurada, y que no
//     se solape con NINGUNA OTRA cita activa (excluyéndose a sí misma).
//  4. Actualiza fecha_hora_inicio/fin (recalculado con la duración del
//     servicio) y, si estaba "confirmada", la vuelve a dejar "pendiente"
//     — el fisio tiene que confirmar el nuevo horario igual que con una
//     reserva nueva.
//  5. Avisa por email al fisio del cambio, y al paciente (si dejó email).
//
// Variables de entorno necesarias (las mismas que crear-cita/cancelar-cita):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY   (NUNCA usar la anon key aquí)
//  - RESEND_API_KEY / RESEND_FROM / EMAIL_FISIO
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, enviarEmail, jsonResponse } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_FISIO = Deno.env.get("EMAIL_FISIO") ?? "rubio-n13@hotmail.com";
const TZ = "Europe/Madrid";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---- Helpers de fecha/hora en la zona horaria de la clínica -----------
// Duplicados de crear-cita a propósito: cada Edge Function de este proyecto
// es autocontenida (ver el mismo patrón en cancelar-cita), así que no hay
// un módulo compartido de fecha/hora del que depender aquí.
function diaSemanaLocal(fecha: Date): number {
  const dia = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(fecha);
  const mapa: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return mapa[dia];
}

function horaLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const obtener = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
  return `${obtener("hour")}:${obtener("minute")}:${obtener("second")}`;
}

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}

function formatearHora(fecha: Date) {
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

type CitaConServicio = {
  id: string;
  paciente_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  servicio_id: string;
  servicios: { nombre: string; duracion_minutos: number } | null;
  pacientes: { nombre: string; email: string | null } | null;
};

async function buscarCitaPorToken(token: string) {
  return await supabaseAdmin
    .from("citas")
    .select(
      "id, paciente_id, fecha_hora_inicio, fecha_hora_fin, estado, servicio_id, servicios(nombre, duracion_minutos), pacientes(nombre, email)"
    )
    .eq("token_cancelacion", token)
    .maybeSingle<CitaConServicio>();
}

async function notificarReprogramacionFisio(datos: {
  servicioNombre: string;
  pacienteNombre: string;
  anterior: Date;
  nuevo: Date;
}) {
  await enviarEmail({
    to: [EMAIL_FISIO],
    subject: `Cita reprogramada: ${datos.pacienteNombre} · ${formatearFecha(datos.nuevo)}`,
    html: `
      <h2>Un paciente ha cambiado la fecha/hora de su cita</h2>
      <p><strong>Servicio:</strong> ${datos.servicioNombre}</p>
      <p><strong>Paciente:</strong> ${datos.pacienteNombre}</p>
      <p><strong>Antes:</strong> ${formatearFecha(datos.anterior)} a las ${formatearHora(datos.anterior)}</p>
      <p><strong>Ahora:</strong> ${formatearFecha(datos.nuevo)} a las ${formatearHora(datos.nuevo)}</p>
      <p>La cita ha vuelto a quedar pendiente de confirmar desde el panel.</p>
    `,
  });
}

async function notificarReprogramacionPaciente(datos: {
  pacienteEmail: string;
  pacienteNombre: string;
  servicioNombre: string;
  nuevo: Date;
}) {
  await enviarEmail({
    to: [datos.pacienteEmail],
    subject: `Hemos cambiado tu cita en issifiss · ${formatearFecha(datos.nuevo)}`,
    html: `
      <h2>Nuevo horario registrado</h2>
      <p>Hola ${datos.pacienteNombre}, hemos actualizado tu cita:</p>
      <p><strong>Servicio:</strong> ${datos.servicioNombre}</p>
      <p><strong>Nueva fecha:</strong> ${formatearFecha(datos.nuevo)}</p>
      <p><strong>Nueva hora:</strong> ${formatearHora(datos.nuevo)}</p>
      <p>Tu fisio la revisará y te avisaremos por email en cuanto quede confirmada.</p>
    `,
  });
}

interface ReprogramarPayload {
  token: string;
  fecha_hora_inicio: string; // ISO 8601
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const payload: ReprogramarPayload = await req.json().catch(() => ({} as ReprogramarPayload));
    if (!payload.token || !payload.fecha_hora_inicio) {
      return jsonResponse({ error: "Faltan datos obligatorios" }, 400);
    }

    const { data: cita, error: buscarError } = await buscarCitaPorToken(payload.token);
    if (buscarError || !cita) {
      return jsonResponse({ error: "No se ha encontrado ninguna cita con ese enlace" }, 404);
    }
    if (!["pendiente", "confirmada"].includes(cita.estado)) {
      return jsonResponse({ error: "Esta cita ya no se puede cambiar de horario" }, 409);
    }
    if (!cita.servicios) {
      return jsonResponse({ error: "El servicio de esta cita ya no existe" }, 400);
    }

    const nuevoInicio = new Date(payload.fecha_hora_inicio);
    if (isNaN(nuevoInicio.getTime())) {
      return jsonResponse({ error: "Fecha/hora no válida" }, 400);
    }
    if (nuevoInicio.getTime() < Date.now()) {
      return jsonResponse({ error: "No se puede elegir una fecha pasada" }, 400);
    }
    const nuevoFin = new Date(nuevoInicio.getTime() + cita.servicios.duracion_minutos * 60_000);

    // ---- Disponibilidad configurada para ese día/hora ----
    const diaSemana = diaSemanaLocal(nuevoInicio);
    const horaInicioStr = horaLocal(nuevoInicio);
    const horaFinStr = horaLocal(nuevoFin);

    const { data: franjas, error: franjasError } = await supabaseAdmin
      .from("disponibilidad")
      .select("hora_inicio, hora_fin")
      .eq("dia_semana", diaSemana)
      .eq("activo", true);
    if (franjasError) {
      return jsonResponse({ error: "Error comprobando disponibilidad" }, 500);
    }
    const dentroDeFranja = (franjas ?? []).some(
      (f) => horaInicioStr >= f.hora_inicio && horaFinStr <= f.hora_fin
    );
    if (!dentroDeFranja) {
      return jsonResponse({ error: "El horario elegido no está disponible" }, 409);
    }

    // ---- Solapamiento con otras citas activas (excluyéndose a sí misma) ----
    const { data: solapadas, error: solapeError } = await supabaseAdmin
      .from("citas")
      .select("id")
      .neq("id", cita.id)
      .in("estado", ["pendiente", "confirmada"])
      .lt("fecha_hora_inicio", nuevoFin.toISOString())
      .gt("fecha_hora_fin", nuevoInicio.toISOString());
    if (solapeError) {
      return jsonResponse({ error: "Error comprobando solapamientos" }, 500);
    }
    if (solapadas && solapadas.length > 0) {
      return jsonResponse({ error: "Ese horario acaba de ser reservado por otra persona" }, 409);
    }

    // ---- Actualizar ----
    // Si estaba confirmada, el cambio de horario la vuelve a dejar pendiente
    // de que el fisio la revise — igual que una reserva nueva.
    const nuevoEstado = cita.estado === "confirmada" ? "pendiente" : cita.estado;
    const anteriorInicio = new Date(cita.fecha_hora_inicio);

    const { data: citaActualizada, error: updateError } = await supabaseAdmin
      .from("citas")
      .update({
        fecha_hora_inicio: nuevoInicio.toISOString(),
        fecha_hora_fin: nuevoFin.toISOString(),
        estado: nuevoEstado,
      })
      .eq("id", cita.id)
      .select("id, fecha_hora_inicio, fecha_hora_fin, estado, servicio_id, servicios(nombre, duracion_minutos)")
      .single();

    if (updateError) {
      // 23P01 = violación de la exclusion constraint (solapamiento detectado por Postgres)
      if (updateError.code === "23P01") {
        return jsonResponse({ error: "Ese horario acaba de ser reservado por otra persona" }, 409);
      }
      return jsonResponse({ error: "No se pudo cambiar el horario de la cita" }, 500);
    }

    const servicioNombre = cita.servicios.nombre;
    const pacienteNombre = cita.pacientes?.nombre ?? "Paciente";
    const pacienteEmail = cita.pacientes?.email ?? null;

    await Promise.all([
      notificarReprogramacionFisio({ servicioNombre, pacienteNombre, anterior: anteriorInicio, nuevo: nuevoInicio }),
      pacienteEmail
        ? notificarReprogramacionPaciente({ pacienteEmail, pacienteNombre, servicioNombre, nuevo: nuevoInicio })
        : Promise.resolve(),
    ]);

    return jsonResponse({ cita: citaActualizada }, 200);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Error inesperado en el servidor" }, 500);
  }
});
