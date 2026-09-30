-- =====================================================================
-- ISSIFISS · Habilitar Realtime para citas/pacientes/disponibilidad/servicios
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase.
--
-- Por qué hace falta (bug real encontrado en auditoría):
-- AppointmentsContext.jsx ya se suscribe con
-- supabase.channel("admin-citas-pacientes").on("postgres_changes", ...) a
-- estas 4 tablas, con el comentario de que así "todo tab/dispositivo
-- abierto se mantiene sincronizado". Pero esa suscripción nunca emitía
-- nada: ninguna tabla del proyecto estaba añadida a la publicación
-- "supabase_realtime" (verificado con
-- `select * from pg_publication_tables where pubname='supabase_realtime'`,
-- vacío antes de este script). El panel solo se refrescaba gracias a las
-- llamadas explícitas a refreshX() después de cada mutación DENTRO de la
-- misma pestaña — dos pestañas de admin abiertas, o un cambio hecho desde
-- otro dispositivo, nunca se veían reflejados sin recargar manualmente.
-- =====================================================================

alter publication supabase_realtime add table citas, pacientes, disponibilidad, servicios;
