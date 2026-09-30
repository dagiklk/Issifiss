-- =====================================================================
-- ISSIFISS · Ocultar token_confirmacion de las consultas del cliente
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase.
-- ✅ Ya aplicado en producción (verificado con has_column_privilege() y una
-- llamada REST real pidiendo token_confirmacion, que ahora devuelve 42501
-- "permission denied"). Este archivo se deja como referencia/documentación.
--
-- Por qué hace falta (vulnerabilidad real, ver auditoría):
-- "citas_propias_select" (schema_cuentas_clientes.sql) da a un cliente
-- autenticado acceso de lectura a TODAS las columnas de su propia fila en
-- "citas" — las políticas RLS filtran filas, no columnas. Eso incluye
-- "token_confirmacion" (schema_confirmar_cita.sql), pensado para que SOLO el
-- fisio lo reciba por email y confirme la cita con un clic sin loguearse.
--
-- Cualquier cliente autenticado puede, sin pasar por la app, hacer una
-- llamada directa a la API REST de Supabase con su propio JWT y pedir
-- explícitamente esa columna de su propia cita (aunque el frontend nunca la
-- pida, ver MiCuenta.jsx). Con ese token puede llamar él mismo a la Edge
-- Function "confirmar-cita" y auto-confirmar su cita "pendiente" sin que el
-- fisio la haya revisado nunca — salta el paso de aprobación manual.
--
-- La Service Role Key (todas las Edge Functions) no se ve afectada: bypassa
-- siempre RLS y privilegios de columna, así que crear-cita/cancelar-cita/
-- reprogramar-cita/confirmar-cita siguen funcionando exactamente igual.
--
-- El panel de admin (AppointmentsContext.jsx, CITA_SELECT) deja de pedir
-- "*" y pasa a una lista explícita de columnas sin "token_confirmacion" —
-- el admin nunca lo mostraba en la UI, así que no se pierde nada ahí.
-- =====================================================================

-- Postgres no permite revocar una sola columna cuando el rol ya tiene SELECT
-- a nivel de tabla completa (el privilegio de tabla "gana"): hay que revocar
-- SELECT de la tabla entera y volver a concederlo columna por columna, sin
-- incluir "token_confirmacion". "token_cancelacion" SÍ se mantiene: ese es
-- el que la propia app ya usa legítimamente para que el cliente cancele o
-- reprograme su propia cita.
revoke select on citas from authenticated, anon;

grant select (
  id, paciente_id, servicio_id, fecha_hora_inicio, fecha_hora_fin,
  estado, token_cancelacion, notas, creado_en, precio
) on citas to authenticated, anon;
