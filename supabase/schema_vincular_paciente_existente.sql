-- =====================================================================
-- ISSIFISS · Vincular cuenta con una reserva de invitado anterior
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase, después
-- de supabase/schema_cuentas_clientes.sql.
--
-- Por qué hace falta:
-- Este proyecto tiene la confirmación de email activada (mailer_autoconfirm
-- = false), así que crear la cuenta al reservar NO da sesión inmediata: la
-- reserva se guarda igual que la de un invitado (enlazada por email) y la
-- cuenta queda pendiente de confirmar. Cuando el cliente confirma su email
-- e inicia sesión por primera vez, el frontend necesita "adoptar" ese
-- paciente ya existente (con la reserva dentro) en vez de crearle uno
-- nuevo vacío — y no puede hacerlo por sí solo porque las políticas RLS
-- normales solo dejan tocar filas que YA sean suyas (user_id = auth.uid()),
-- que es precisamente lo que todavía no es cierto en ese momento.
-- =====================================================================

create or replace function claim_paciente_by_email()
returns pacientes
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado pacientes;
  mi_email text;
begin
  select email into mi_email from auth.users where id = auth.uid();
  if mi_email is null then
    return null;
  end if;

  -- "limit 1": si por lo que sea hay más de un paciente invitado con este
  -- mismo email (p.ej. una familia reservando varias veces con un email
  -- compartido), sin este límite el update de más abajo los enlazaría TODOS
  -- a esta cuenta de golpe — historiales de personas distintas mezclados en
  -- un solo login. Nos quedamos con el más reciente.
  update pacientes
  set user_id = auth.uid()
  where id = (
    select id from pacientes
    where user_id is null and email = mi_email
    order by fecha_alta desc
    limit 1
  )
  returning * into resultado;

  return resultado;
end;
$$;

comment on function claim_paciente_by_email() is
  'Enlaza con el usuario autenticado actual un paciente ya existente (sin cuenta) que comparta su mismo email verificado, en vez de crear uno duplicado.';

grant execute on function claim_paciente_by_email() to authenticated;
