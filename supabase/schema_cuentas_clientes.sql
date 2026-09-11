-- =====================================================================
-- ISSIFISS · Cuentas de cliente (login real para pacientes habituales)
-- -----------------------------------------------------------------------
-- Instrucciones:
-- 1. Pega este script en el SQL Editor de Supabase (Project > SQL Editor > New query)
--    DESPUÉS de haber ejecutado supabase/schema.sql, y ejecútalo completo.
-- 2. Da de alta al fisio como administrador (sustituye el email):
--
--      insert into admins (user_id)
--      select id from auth.users where email = 'tu-email-de-fisio@ejemplo.com';
--
--    Sin este paso, tras ejecutar este script el fisio perdería el acceso
--    de administrador al panel, porque las políticas dejan de dar acceso
--    total a "cualquier" usuario autenticado y pasan a exigir pertenecer
--    a esta lista.
-- =====================================================================
--
-- Por qué hace falta este script:
-- Hasta ahora el único usuario autenticado de la app era el propio fisio,
-- así que las políticas RLS daban acceso total a "cualquier" authenticated
-- (`using (true)`). En cuanto un cliente puede registrarse con Supabase
-- Auth para no repetir sus datos en cada reserva, esa misma regla le daría
-- acceso de administrador a los datos de salud de TODOS los pacientes.
-- Este script introduce una lista blanca de administradores y reescribe
-- esas políticas para exigir pertenecer a ella, además de dar a cada
-- cliente logueado acceso solo a su propio registro de paciente y a sus
-- propias citas.
-- =====================================================================

-- =====================================================================
-- 1. LISTA BLANCA DE ADMINISTRADORES
-- =====================================================================
create table if not exists admins (
    user_id uuid primary key references auth.users(id) on delete cascade
);

comment on table admins is 'Usuarios de Supabase Auth con acceso de administrador (el/los fisios)';

alter table admins enable row level security;
-- Nadie necesita leer esta tabla desde el cliente: is_admin() la consulta
-- internamente como security definer. No se crea ninguna política de
-- select/insert/update/delete para authenticated ni anon a propósito.

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_admin() to authenticated, anon;

-- =====================================================================
-- 2. REESCRIBIR POLÍTICAS DE ADMINISTRADOR: de "cualquier autenticado"
--    a "solo quien esté en admins"
-- =====================================================================
drop policy if exists "servicios_admin_all" on servicios;
create policy "servicios_admin_all"
    on servicios for all
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "disponibilidad_admin_all" on disponibilidad;
create policy "disponibilidad_admin_all"
    on disponibilidad for all
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "pacientes_admin_all" on pacientes;
create policy "pacientes_admin_all"
    on pacientes for all
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "citas_admin_all" on citas;
create policy "citas_admin_all"
    on citas for all
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "bonos_admin_all" on bonos;
create policy "bonos_admin_all"
    on bonos for all
    to authenticated
    using (is_admin())
    with check (is_admin());

-- =====================================================================
-- 3. VINCULAR "pacientes" CON SU CUENTA DE Supabase Auth
-- =====================================================================
alter table pacientes add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- =====================================================================
-- 4. POLÍTICAS PARA QUE UN CLIENTE VEA/EDITE SOLO LO SUYO
-- =====================================================================
create policy "pacientes_propio_select"
    on pacientes for select
    to authenticated
    using (user_id = auth.uid());

create policy "pacientes_propio_insert"
    on pacientes for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "pacientes_propio_update"
    on pacientes for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "citas_propias_select"
    on citas for select
    to authenticated
    using (paciente_id in (select id from pacientes where user_id = auth.uid()));

-- =====================================================================
-- NOTAS
-- =====================================================================
-- 1. Un cliente solo puede LEER e INSERTAR/ACTUALIZAR su propia fila en
--    "pacientes" (con su propio user_id), y solo LEER sus propias citas.
--    No puede crear ni cancelar citas directamente contra la tabla: la
--    reserva pública sigue pasando por la Edge Function "crear-cita" (que
--    ahora, si detecta un usuario logueado, enlaza la cita a su paciente
--    en vez de crear uno nuevo) y la cancelación sigue haciéndose por
--    token a través de "cancelar-cita", igual que para invitados.
-- 2. Las políticas "_admin_all" y las "_propio_*"/"_propias_*" conviven:
--    Postgres las combina con OR, así que el fisio (is_admin() = true)
--    sigue viendo y gestionando todo, y un cliente normal (is_admin() =
--    false) solo accede a lo que le pertenece.
-- =====================================================================
