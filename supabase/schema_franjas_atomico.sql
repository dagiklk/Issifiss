-- =====================================================================
-- ISSIFISS · Reemplazo atómico de las franjas de disponibilidad de un día
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase, después
-- de supabase/schema_cuentas_clientes.sql (usa is_admin()).
--
-- Por qué hace falta:
-- HorarioEditor.jsx guardaba un día haciendo, desde el cliente, un DELETE de
-- todas las franjas de ese día de la semana seguido de un INSERT de las
-- nuevas — dos llamadas sueltas, no una transacción. Si el DELETE tenía
-- éxito pero el INSERT fallaba (red, validación...), el día se quedaba SIN
-- NINGUNA franja en la base de datos, sin que nadie se enterase hasta que un
-- paciente no pudiera reservar ese día. Esta función hace ambas cosas dentro
-- de la misma transacción implícita de la llamada a la función: si el INSERT
-- falla, el DELETE también se deshace.
-- =====================================================================

create or replace function reemplazar_franjas_dia(p_dia_semana int, p_franjas jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  delete from disponibilidad where dia_semana = p_dia_semana;

  insert into disponibilidad (dia_semana, hora_inicio, hora_fin, activo)
  select p_dia_semana, (f->>'horaInicio')::time, (f->>'horaFin')::time, true
  from jsonb_array_elements(p_franjas) as f;
end;
$$;

comment on function reemplazar_franjas_dia(int, jsonb) is
  'Reemplaza de forma atómica las franjas de disponibilidad de un día de la semana (borra + inserta en la misma transacción de la función), para que un fallo a mitad de camino no deje el día sin ninguna franja. Usada por HorarioEditor.jsx vía AppointmentsContext.guardarFranjasDia.';

grant execute on function reemplazar_franjas_dia(int, jsonb) to authenticated;
