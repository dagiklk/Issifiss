// =====================================================================
// ISSIFISS · Edge Function: notificar-confirmacion
// -----------------------------------------------------------------------
// Ruta prevista: supabase/functions/notificar-confirmacion/index.ts
// Deploy: supabase functions deploy notificar-confirmacion
//
// Por qué existe:
//  Cuando se reserva, el paciente ya recibe un aviso de "solicitud
//  recibida" (ver crear-cita), pero la cita sigue en estado "pendiente"
//  hasta que el fisio la confirma desde el panel de administración — esa
//  confirmación se hace con una actualización directa a la tabla "citas"
//  (RLS + is_admin(), sin pasar por ninguna Edge Function), así que hace
//  falta este endpoint aparte para avisar al paciente por email en ese
//  momento exacto.
//
// Qué hace:
//  - POST { cita_id }, autenticado con el access token del fisio (no la
//    anon key): comprueba que quien llama es admin (is_admin()), busca la
//    cita y, si está "confirmada" y el paciente dejó email, le envía el
//    aviso de confirmación.
//
// Variables de entorno necesarias (se configuran con `supabase secrets set`,
// las mismas que ya usan crear-cita/cancelar-cita):
//  - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (las
//    inyecta Supabase automáticamente en toda Edge Function)
//  - RESEND_API_KEY / RESEND_FROM
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, enviarEmail, jsonResponse } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TZ = "Europe/Madrid";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}

function formatearHora(fecha: Date) {
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

type CitaConfirmada = {
  fecha_hora_inicio: string;
  estado: string;
  pacientes: { nombre: string; email: string | null } | null;
  servicios: { nombre: string } | null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return jsonResponse({ error: "Falta autenticación" }, 401);
    }

    // Solo el fisio puede disparar este aviso — comprobamos is_admin() con
    // el propio token de quien llama (no con la service role key).
    const clienteConToken = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: esAdmin, error: adminError } = await clienteConToken.rpc("is_admin");
    if (adminError || esAdmin !== true) {
      return jsonResponse({ error: "No autorizado" }, 403);
    }

    const { cita_id } = await req.json();
    if (!cita_id) {
      return jsonResponse({ error: "Falta cita_id" }, 400);
    }

    const { data: cita, error: citaError } = await supabaseAdmin
      .from("citas")
      .select("fecha_hora_inicio, estado, pacientes(nombre, email), servicios(nombre)")
      .eq("id", cita_id)
      .single<CitaConfirmada>();

    if (citaError || !cita) {
      return jsonResponse({ error: "Cita no encontrada" }, 404);
    }

    if (cita.estado === "confirmada" && cita.pacientes?.email) {
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

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Error inesperado en el servidor" }, 500);
  }
});
