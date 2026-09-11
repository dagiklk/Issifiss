import { supabase } from "./supabaseClient.js";

// Ensures the logged-in client has a "pacientes" row linked via user_id,
// creating one from their signup metadata the first time it's needed. This
// covers both an immediate session after signUp() and the case where email
// confirmation is required — the row can't be created at signup time (no
// session yet), so it's created lazily here the first time they log in.
export async function obtenerPacientePropio(user) {
  if (!user) return null;

  const { data: existente, error } = await supabase.from("pacientes").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (existente) return existente;

  // Puede que ya reservara como invitado con este mismo email antes de
  // confirmar su cuenta (la confirmación por email está activada en este
  // proyecto, así que no hay sesión inmediata al reservar): adoptamos ese
  // paciente en vez de crearle uno nuevo vacío. Ver claim_paciente_by_email()
  // en supabase/schema_vincular_paciente_existente.sql.
  const { data: adoptado, error: claimError } = await supabase.rpc("claim_paciente_by_email");
  if (!claimError && adoptado) return adoptado;

  const meta = user.user_metadata || {};
  const { data: nuevo, error: insertError } = await supabase
    .from("pacientes")
    .insert({
      user_id: user.id,
      nombre: meta.nombre?.trim() || user.email,
      telefono: meta.telefono?.trim() || null,
      email: user.email,
      consentimiento_rgpd: true,
      consentimiento_fecha: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return nuevo;
}
