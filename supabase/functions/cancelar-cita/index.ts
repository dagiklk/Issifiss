// =====================================================================
// ISSIFISS · Edge Function: cancelar-cita
// -----------------------------------------------------------------------
// Ruta prevista: supabase/functions/cancelar-cita/index.ts
// Deploy: supabase functions deploy cancelar-cita
//
// Por qué existe:
//  La tabla "citas" no tiene ninguna política RLS para el rol "anon" (a
//  propósito, ver supabase/schema.sql), así que el frontend NO puede leer
//  ni actualizar "citas" directamente con la anon key. La página pública
//  /cancelar necesita buscar y cancelar una cita a partir de su
//  token_cancelacion sin exponer el resto de la tabla, así que pasa por
//  esta Edge Function con la Service Role Key, igual que "crear-cita".
//
// Qué hace:
//  - GET  ?token=...  -> busca la cita por token y devuelve sus datos públicos.
//  - POST { token }   -> cancela la cita (si no estaba ya cancelada) y avisa
//                        por email al fisio.
//
// Variables de entorno necesarias (se configuran con `supabase secrets set`):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY   (NUNCA usar la anon key aquí)
//  - RESEND_API_KEY / RESEND_FROM / EMAIL_FISIO   (mismas que crear-cita)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, enviarEmail, jsonResponse } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_FISIO = Deno.env.get("EMAIL_FISIO") ?? "rubio-n13@hotmail.com";
const TZ = "Europe/Madrid";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type CitaPublica = {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  servicio_id: string;
  servicios: { nombre: string; duracion_minutos: number } | null;
};

// servicio_id/duracion_minutos se añadieron para que el frontend pueda
// ofrecer "cambiar fecha u hora" (ver reprogramar-cita) con el selector de
// horario, que necesita conocer la duración de la sesión — ninguno de los
// dos es un dato sensible, así que ampliar este select no cambia el modelo
// de seguridad (el acceso sigue gateado por conocer el token).
async function buscarCitaPorToken(token: string) {
  return await supabaseAdmin
    .from("citas")
    .select("id, fecha_hora_inicio, fecha_hora_fin, estado, servicio_id, servicios(nombre, duracion_minutos)")
    .eq("token_cancelacion", token)
    .maybeSingle<CitaPublica>();
}

async function notificarCancelacion(cita: CitaPublica) {
  const fechaFmt = new Date(cita.fecha_hora_inicio).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
  const horaFmt = new Date(cita.fecha_hora_inicio).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });

  await enviarEmail({
    to: [EMAIL_FISIO],
    subject: `Cita cancelada · ${fechaFmt}`,
    html: `
      <h2>Un paciente ha cancelado su cita</h2>
      <p><strong>Servicio:</strong> ${cita.servicios?.nombre ?? "—"}</p>
      <p><strong>Fecha:</strong> ${fechaFmt}</p>
      <p><strong>Hora:</strong> ${horaFmt}</p>
      <p>El hueco ha quedado libre en la agenda de issifiss.</p>
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
        return jsonResponse({ cita }, 200);
      }

      const { data: citaActualizada, error: updateError } = await supabaseAdmin
        .from("citas")
        .update({ estado: "cancelada" })
        .eq("token_cancelacion", token)
        .select("id, fecha_hora_inicio, fecha_hora_fin, estado, servicio_id, servicios(nombre, duracion_minutos)")
        .single<CitaPublica>();

      if (updateError || !citaActualizada) {
        return jsonResponse({ error: "No se pudo cancelar la cita" }, 500);
      }

      // Si el email falla, no debe impedir que la cancelación se confirme:
      // la cita ya ha quedado cancelada en la base de datos.
      await notificarCancelacion(citaActualizada);

      return jsonResponse({ cita: citaActualizada }, 200);
    }

    return jsonResponse({ error: "Método no permitido" }, 405);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Error inesperado en el servidor" }, 500);
  }
});
