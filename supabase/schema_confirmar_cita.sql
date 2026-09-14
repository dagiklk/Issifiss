-- =====================================================================
-- ISSIFISS · Confirmar cita con un clic desde el email al fisio
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase.
--
-- Por qué hace falta:
-- El email de "nueva solicitud de cita" que recibe el fisio (ver Edge
-- Function crear-cita) solo decía "entra al panel para confirmarla". Para
-- poder incluir un enlace de confirmación directo en ese email, cada cita
-- necesita su propio token — reutilizar "token_cancelacion" no vale: ese
-- token se envía al PACIENTE (para cancelar su propia cita) y mezclarlo con
-- una acción distinta pensada para el fisio (confirmar) es confuso y hace
-- que ambos flujos compartan un mismo secreto sin necesidad.
-- =====================================================================

alter table citas add column if not exists token_confirmacion uuid not null default gen_random_uuid();

comment on column citas.token_confirmacion is
  'Token único para confirmar la cita desde el enlace del email al fisio (Edge Function confirmar-cita), sin necesidad de iniciar sesión en el panel.';
