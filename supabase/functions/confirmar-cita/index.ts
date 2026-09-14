// =====================================================================
// ISSIFISS · Edge Function: confirmar-cita
// -----------------------------------------------------------------------
// Ruta prevista: supabase/functions/confirmar-cita/index.ts
// Deploy: supabase functions deploy confirmar-cita
//
// Por qué existe:
//  El email de "nueva solicitud de cita" que recibe el fisio (ver
//  crear-cita) incluye un enlace para confirmarla con un clic, sin tener
//  que entrar al panel a buscarla. Ese enlace apunta a la página del
//  frontend "/confirmar?token=..." (Confirmar.jsx), que es la que llama a
//  esta función — igual que "/cancelar" ya hace con cancelar-cita. Esta
//  función NO sirve HTML directamente: Supabase fuerza
//  "Content-Type: text/plain" y una CSP "default-src 'none'; sandbox" en lo
//  que devuelven las Edge Functions (para que su dominio compartido no se
//  pueda usar para alojar páginas de phishing), así que una página propia
//  con HTML servida desde aquí no se llegaría a renderizar en el navegador.
//
// Qué hace:
//  - GET  ?token=...  -> devuelve los datos públicos de la cita (igual que
//                        cancelar-cita), para que el frontend pinte la
//                        pantalla de confirmación.
//  - POST { token }   -> confirma la cita (si estaba "pendiente") y avisa
//                        por email al paciente.
//
// Variables de entorno necesarias (las mismas que ya usan crear-cita /
// cancelar-cita / notificar-confirmacion):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY   (NUNCA usar la anon key aquí)
//  - RESEND_API_KEY / RESEND_FROM
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, enviarEmail, jsonResponse } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TZ = "Europe/Madrid";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type CitaConfirmable = {
  id: string;
  estado: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  servicio_id: string;
  pacientes: { nombre: string; email: string | null } | null;
  servicios: { nombre: string; duracion_minutos: number } | null;
};

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}

function formatearHora(fecha: Date) {
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

async function buscarCitaPorToken(token: string) {
  return await supabaseAdmin
    .from("citas")
    .select(
      "id, estado, fecha_hora_inicio, fecha_hora_fin, servicio_id, pacientes(nombre, email), servicios(nombre, duracion_minutos)"
    )
    .eq("token_confirmacion", token)
    .maybeSingle<CitaConfirmable>();
}

async function notificarConfirmacionPaciente(cita: CitaConfirmable) {
  if (!cita.pacientes?.email) return;
  const inicio = new Date(cita.fecha_hora_inicio);

  await enviarEmail({
    to: [cita.pacientes.email],
    subject: `Tu cita en issifiss está confirmada · ${formatearFecha(inicio)}`,
    html: `
      <h2>¡Tu cita está confirmada!</h2>
      <p>Hola ${cita.pacientes.nombre}, tu fisio ha confirmado tu reserva:</p>
      <p><strong>Servicio:</strong> ${cita.servicios?.nombre ?? "Sesión"}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(inicio)}</p>
      <p><strong>Hora:</strong> ${formatearHora(inicio)}</p>
      <p>¡Te esperamos!</p>
    `,
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    if (req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) {
        return jsonResponse({ error: "Falta el token de la cita" }, 400);
      }

      const { data: cita, error } = await buscarCitaPorToken(token);
      if (error || !cita) {
        return jsonResponse({ error: "No se ha encontrado ninguna cita con ese enlace" }, 404);
      }

      return jsonResponse({ cita }, 200);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const token: string | undefined = body.token;
      if (!token) {
        return jsonResponse({ error: "Falta el token de la cita" }, 400);
      }

      const { data: cita, error: buscarError } = await buscarCitaPorToken(token);
      if (buscarError || !cita) {
        return jsonResponse({ error: "No se ha encontrado ninguna cita con ese enlace" }, 404);
      }
      if (cita.estado === "cancelada") {
        return jsonResponse({ error: "Esta cita ya fue cancelada, no se puede confirmar" }, 409);
      }
      if (cita.estado === "confirmada") {
        return jsonResponse({ cita }, 200);
      }

      const { data: citaActualizada, error: updateError } = await supabaseAdmin
        .from("citas")
        .update({ estado: "confirmada" })
        .eq("token_confirmacion", token)
        .eq("estado", "pendiente")
        .select(
          "id, estado, fecha_hora_inicio, fecha_hora_fin, servicio_id, pacientes(nombre, email), servicios(nombre, duracion_minutos)"
        )
        .single<CitaConfirmable>();

      if (updateError || !citaActualizada) {
        return jsonResponse({ error: "No se pudo confirmar la cita" }, 500);
      }

      // Si el email falla, no debe impedir que la confirmación se guarde:
      // la cita ya ha quedado confirmada en la base de datos.
      await notificarConfirmacionPaciente(citaActualizada);

      return jsonResponse({ cita: citaActualizada }, 200);
    }

    return jsonResponse({ error: "Método no permitido" }, 405);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Error inesperado en el servidor" }, 500);
  }
});
