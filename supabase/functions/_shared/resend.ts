// =====================================================================
// ISSIFISS · Helper compartido para enviar emails vía Resend
// Usado por las Edge Functions crear-cita y cancelar-cita.
// =====================================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// Mientras no verifiques un dominio propio en Resend, el remitente tiene que
// ser "onboarding@resend.dev" y solo llegará a la cuenta con la que te registraste.
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "issifiss <onboarding@resend.dev>";

export async function enviarEmail(opts: { to: string[]; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está configurada: no se envía el email.");
    return;
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, ...opts }),
    });

    if (!respuesta.ok) {
      console.error("Resend devolvió un error:", await respuesta.text());
    }
  } catch (err) {
    // Un fallo al enviar el email nunca debe romper la operación que lo dispara
    // (la cita ya está guardada/cancelada en la base de datos).
    console.error("No se pudo enviar el email:", err);
  }
}

// Cabeceras CORS básicas para permitir llamadas desde el frontend en React
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // en producción, restringe a tu dominio real
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
