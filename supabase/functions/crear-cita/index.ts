// =====================================================================
// ISSIFISS · Edge Function: crear-cita
// -----------------------------------------------------------------------
// Ruta prevista: supabase/functions/crear-cita/index.ts
// Deploy: supabase functions deploy crear-cita
//
// Qué hace:
//  1. Recibe los datos de la reserva desde el frontend (React).
//  2. Valida que el horario elegido siga cayendo dentro de la
//     "disponibilidad" configurada y que NO se solape con ninguna cita
//     activa existente (doble check, además de la constraint de Postgres).
//  3. Crea o reutiliza el registro en "pacientes" (busca por email/teléfono).
//  4. Inserta la cita usando la Service Role Key (evita exponerla en el
//     cliente y evita que el frontend escriba directamente en la tabla).
//  5. Devuelve la cita creada, incluido su token_cancelacion.
//  6. Notifica la nueva cita por email al fisio y, si el paciente dejó
//     email, le envía la confirmación con el enlace para cancelarla.
//
// Variables de entorno necesarias (se configuran con `supabase secrets set`):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY   (NUNCA usar la anon key aquí)
//  - RESEND_API_KEY              (https://resend.com/api-keys)
//  - RESEND_FROM                 (opcional, por defecto "issifiss <onboarding@resend.dev>")
//  - EMAIL_FISIO                 (opcional, email del fisio que recibe el aviso)
//  - SITE_URL                    (opcional, ej: https://issifiss.com — para el enlace de cancelación)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, enviarEmail, jsonResponse } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_FISIO = Deno.env.get("EMAIL_FISIO") ?? "rubio-n13@hotmail.com";
// URL pública del frontend, para construir el enlace de cancelación que se envía al paciente.
const SITE_URL = (Deno.env.get("SITE_URL") ?? "http://localhost:5173").replace(/\/$/, "");

// Zona horaria de la clínica: toda la lógica de "qué día/hora es esto" para
// comparar contra la tabla "disponibilidad" debe hacerse en esta zona, no en
// UTC — si no, una cita a primera/última hora puede caer en el día
// equivocado según la época del año (CET/CEST).
const TZ = "Europe/Madrid";

// Cliente con permisos de administrador — solo vive dentro de la Edge Function
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 0=domingo ... 6=sábado, igual que Date.prototype.getDay() y la columna
// "disponibilidad.dia_semana", pero calculado en la zona horaria de la clínica.
function diaSemanaLocal(fecha: Date): number {
  const dia = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(fecha);
  const mapa: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return mapa[dia];
}

// "HH:MM:SS" en la zona horaria de la clínica, para comparar con "hora_inicio"/"hora_fin".
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

async function notificarNuevaCita(datos: {
  servicioNombre: string;
  pacienteNombre: string;
  pacienteTelefono?: string | null;
  pacienteEmail?: string | null;
  inicio: Date;
  notas?: string | null;
}) {
  const fechaFmt = formatearFecha(datos.inicio);
  const horaFmt = formatearHora(datos.inicio);

  await enviarEmail({
    to: [EMAIL_FISIO],
    subject: `Nueva solicitud de cita: ${datos.pacienteNombre} · ${fechaFmt}`,
    html: `
      <h2>Nueva solicitud de cita (pendiente de confirmar)</h2>
      <p><strong>Servicio:</strong> ${datos.servicioNombre}</p>
      <p><strong>Fecha:</strong> ${fechaFmt}</p>
      <p><strong>Hora:</strong> ${horaFmt}</p>
      <p><strong>Paciente:</strong> ${datos.pacienteNombre}</p>
      ${datos.pacienteTelefono ? `<p><strong>Teléfono:</strong> ${datos.pacienteTelefono}</p>` : ""}
      ${datos.pacienteEmail ? `<p><strong>Email:</strong> ${datos.pacienteEmail}</p>` : ""}
      ${datos.notas ? `<p><strong>Notas:</strong> ${datos.notas}</p>` : ""}
      <p>Entra al panel de issifiss para confirmarla. El paciente recibirá un email en cuanto lo hagas.</p>
    `,
  });
}

// Al reservar, la cita queda en estado "pendiente" hasta que el fisio la
// confirme desde el panel — este email es solo el aviso de que la solicitud
// se ha recibido. El email de confirmación real se envía aparte, desde la
// Edge Function "notificar-confirmacion", cuando el fisio la confirma.
async function notificarSolicitudPaciente(datos: {
  pacienteEmail: string;
  pacienteNombre: string;
  servicioNombre: string;
  inicio: Date;
  tokenCancelacion: string;
}) {
  const fechaFmt = formatearFecha(datos.inicio);
  const horaFmt = formatearHora(datos.inicio);
  const enlaceCancelacion = `${SITE_URL}/cancelar?token=${datos.tokenCancelacion}`;

  await enviarEmail({
    to: [datos.pacienteEmail],
    subject: `Hemos recibido tu solicitud de cita en issifiss · ${fechaFmt}`,
    html: `
      <h2>¡Solicitud recibida!</h2>
      <p>Hola ${datos.pacienteNombre}, hemos registrado tu solicitud de cita:</p>
      <p><strong>Servicio:</strong> ${datos.servicioNombre}</p>
      <p><strong>Fecha:</strong> ${fechaFmt}</p>
      <p><strong>Hora:</strong> ${horaFmt}</p>
      <p>Tu fisio la revisará y te avisaremos por email en cuanto quede confirmada.</p>
      <p>Si necesitas cancelarla, puedes hacerlo desde este enlace:</p>
      <p><a href="${enlaceCancelacion}">${enlaceCancelacion}</a></p>
    `,
  });
}

// Escapa un valor para usarlo dentro de un filtro .or()/.eq() de PostgREST
// construido a mano. Los caracteres "," "." "(" ")" tienen significado
// especial en la sintaxis de filtros de PostgREST (separan condiciones), así
// que un email/teléfono con uno de esos caracteres podría, sin este escape,
// inyectar condiciones adicionales en el filtro (p. ej. forzar que matchee
// con cualquier fila en vez de solo con la que tiene ese email exacto).
// PostgREST soporta values entrecomillados con comillas dobles para evitar
// justo esto: https://postgrest.org/en/stable/references/api/tables_views.html#reserved-characters
function valorFiltroSeguro(valor: string): string {
  return `"${valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

interface CrearCitaPayload {
  servicio_id: string;
  fecha_hora_inicio: string; // ISO 8601, ej: "2026-09-10T10:00:00.000Z"
  paciente: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  consentimiento_rgpd: boolean;
  notas?: string;
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const payload: CrearCitaPayload = await req.json();

    // ---- Validaciones básicas de entrada ----
    if (!payload.servicio_id || !payload.fecha_hora_inicio || !payload.paciente?.nombre) {
      return jsonResponse({ error: "Faltan datos obligatorios" }, 400);
    }
    if (!payload.consentimiento_rgpd) {
      return jsonResponse({ error: "Debes aceptar el consentimiento de tratamiento de datos" }, 400);
    }

    // ---- 1. Obtener el servicio para conocer su duración ----
    const { data: servicio, error: servicioError } = await supabaseAdmin
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, activo")
      .eq("id", payload.servicio_id)
      .single();

    if (servicioError || !servicio || !servicio.activo) {
      return jsonResponse({ error: "Servicio no válido" }, 400);
    }

    const inicio = new Date(payload.fecha_hora_inicio);
    if (isNaN(inicio.getTime())) {
      return jsonResponse({ error: "Fecha/hora no válida" }, 400);
    }
    const fin = new Date(inicio.getTime() + servicio.duracion_minutos * 60_000);

    // No permitir reservas en el pasado
    if (inicio.getTime() < Date.now()) {
      return jsonResponse({ error: "No se puede reservar una fecha pasada" }, 400);
    }

    // ---- 2. Comprobar que el horario cae dentro de la disponibilidad configurada ----
    const diaSemana = diaSemanaLocal(inicio); // 0=domingo ... 6=sábado, hora local de la clínica
    const horaInicioStr = horaLocal(inicio); // "HH:MM:SS"
    const horaFinStr = horaLocal(fin);

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

    // ---- 3. Comprobar que no se solapa con ninguna cita activa existente ----
    // (la constraint EXCLUDE de Postgres es la red de seguridad final, pero
    //  comprobamos aquí también para devolver un mensaje claro al usuario)
    const { data: solapadas, error: solapeError } = await supabaseAdmin
      .from("citas")
      .select("id")
      .in("estado", ["pendiente", "confirmada"])
      .lt("fecha_hora_inicio", fin.toISOString())
      .gt("fecha_hora_fin", inicio.toISOString());

    if (solapeError) {
      return jsonResponse({ error: "Error comprobando solapamientos" }, 500);
    }
    if (solapadas && solapadas.length > 0) {
      return jsonResponse({ error: "Ese horario acaba de ser reservado por otra persona" }, 409);
    }

    // ---- 4. Buscar o crear el paciente ----
    // Si quien reserva tiene una cuenta de cliente (envía su propio access
    // token, no la anon key), la enlazamos a SU paciente en vez de usar el
    // matching por email/teléfono pensado para invitados — así no se le crea
    // un paciente duplicado cada vez que reserva.
    let usuarioAutenticadoId: string | null = null;
    let emailAutenticadoVerificado: string | null = null;
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user) {
        usuarioAutenticadoId = userData.user.id;
        emailAutenticadoVerificado = userData.user.email ?? null;
      }
    }

    let pacienteId: string;

    if (usuarioAutenticadoId) {
      const { data: pacientePropio } = await supabaseAdmin
        .from("pacientes")
        .select("id")
        .eq("user_id", usuarioAutenticadoId)
        .maybeSingle();

      if (pacientePropio) {
        pacienteId = pacientePropio.id;
      } else {
        // Puede que ya hubiera reservado como invitado antes de crear su
        // cuenta (o antes de confirmar el email): si hay un paciente sin
        // cuenta enlazada con ESE MISMO email, lo adoptamos en vez de crear
        // uno nuevo duplicado. Importante: el email de match tiene que ser
        // el email YA VERIFICADO de la cuenta autenticada (userData.user.email),
        // nunca el que venga en payload.paciente.email — si no, cualquiera con
        // una cuenta podría escribir el email de OTRA persona en el body y
        // quedar vinculado a su ficha de paciente (con todo su historial de
        // citas y notas de salud). Tampoco se hace matching por teléfono aquí
        // por el mismo motivo: ese campo tampoco está verificado.
        const { data: pacienteSinEnlazar } = emailAutenticadoVerificado
          ? await supabaseAdmin
              .from("pacientes")
              .select("id")
              .is("user_id", null)
              .eq("email", emailAutenticadoVerificado)
              .limit(1)
              .maybeSingle()
          : { data: null };

        if (pacienteSinEnlazar) {
          const { error: enlazarError } = await supabaseAdmin
            .from("pacientes")
            .update({ user_id: usuarioAutenticadoId })
            .eq("id", pacienteSinEnlazar.id);
          if (enlazarError) {
            return jsonResponse({ error: "No se pudo vincular tu cuenta al paciente" }, 500);
          }
          pacienteId = pacienteSinEnlazar.id;
        } else {
          const { data: nuevoPaciente, error: pacienteError } = await supabaseAdmin
            .from("pacientes")
            .insert({
              nombre: payload.paciente.nombre,
              telefono: payload.paciente.telefono ?? null,
              email: payload.paciente.email ?? null,
              user_id: usuarioAutenticadoId,
              consentimiento_rgpd: true,
              consentimiento_fecha: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (pacienteError || !nuevoPaciente) {
            return jsonResponse({ error: "No se pudo registrar el paciente" }, 500);
          }
          pacienteId = nuevoPaciente.id;
        }
      }
    } else {
      // Invitado sin sesión: el email/teléfono del body no está verificado,
      // así que solo se reutiliza un paciente que sea también de invitado
      // (user_id null). Sin este filtro, cualquiera podría escribir el
      // email/teléfono de un cliente YA REGISTRADO y crearle citas falsas
      // colgadas de su ficha real.
      const { data: existente } = await supabaseAdmin
        .from("pacientes")
        .select("id")
        .is("user_id", null)
        .or(
          [
            payload.paciente.email ? `email.eq.${valorFiltroSeguro(payload.paciente.email)}` : null,
            payload.paciente.telefono ? `telefono.eq.${valorFiltroSeguro(payload.paciente.telefono)}` : null,
          ]
            .filter(Boolean)
            .join(",")
        )
        .limit(1)
        .maybeSingle();

      if (existente) {
        pacienteId = existente.id;
      } else {
        const { data: nuevoPaciente, error: pacienteError } = await supabaseAdmin
          .from("pacientes")
          .insert({
            nombre: payload.paciente.nombre,
            telefono: payload.paciente.telefono ?? null,
            email: payload.paciente.email ?? null,
            consentimiento_rgpd: true,
            consentimiento_fecha: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (pacienteError || !nuevoPaciente) {
          return jsonResponse({ error: "No se pudo registrar el paciente" }, 500);
        }
        pacienteId = nuevoPaciente.id;
      }
    }

    // ---- 5. Insertar la cita ----
    // Si dos peticiones llegan a la vez para el mismo hueco, la constraint
    // "no_solapamiento_citas" de Postgres rechazará la segunda automáticamente.
    const { data: cita, error: citaError } = await supabaseAdmin
      .from("citas")
      .insert({
        paciente_id: pacienteId,
        servicio_id: servicio.id,
        fecha_hora_inicio: inicio.toISOString(),
        fecha_hora_fin: fin.toISOString(),
        estado: "pendiente",
        precio: servicio.precio,
        notas: payload.notas ?? null,
      })
      .select("id, token_cancelacion, fecha_hora_inicio, fecha_hora_fin, estado")
      .single();

    if (citaError) {
      // Código 23P01 = violación de exclusion constraint (solapamiento detectado por Postgres)
      if (citaError.code === "23P01") {
        return jsonResponse({ error: "Ese horario acaba de ser reservado por otra persona" }, 409);
      }
      return jsonResponse({ error: "No se pudo crear la cita" }, 500);
    }

    // Avisos por email. Si esto falla, no debe impedir que la reserva se
    // confirme al paciente en la UI: la cita ya quedó guardada arriba.
    const servicioNombre = (servicio as { nombre?: string }).nombre ?? "Sesión";

    await Promise.all([
      notificarNuevaCita({
        servicioNombre,
        pacienteNombre: payload.paciente.nombre,
        pacienteTelefono: payload.paciente.telefono,
        pacienteEmail: payload.paciente.email,
        inicio,
        notas: payload.notas,
      }),
      payload.paciente.email
        ? notificarSolicitudPaciente({
            pacienteEmail: payload.paciente.email,
            pacienteNombre: payload.paciente.nombre,
            servicioNombre,
            inicio,
            tokenCancelacion: cita.token_cancelacion,
          })
        : Promise.resolve(),
    ]);

    return jsonResponse({ cita }, 201);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Error inesperado en el servidor" }, 500);
  }
});
