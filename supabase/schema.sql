-- =====================================================================
-- ISSIFISS · Esquema de base de datos para Supabase (PostgreSQL)
-- Plataforma de reservas para consulta de fisioterapia
-- =====================================================================
-- Instrucciones:
-- 1. Pega este script en el SQL Editor de Supabase (Project > SQL Editor > New query)
-- 2. Ejecútalo completo de una vez
-- 3. Revisa en Authentication > Policies que las políticas se hayan creado bien
-- =====================================================================

-- Extensión necesaria para generar UUIDs y tokens aleatorios
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. TABLA: servicios
-- Tipos de sesión que ofrece el fisio (ej: "Primera visita", "Sesión de seguimiento")
-- =====================================================================
create table if not exists servicios (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    duracion_minutos integer not null check (duracion_minutos > 0),
    precio numeric(10,2),
    descripcion text,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

comment on table servicios is 'Tipos de servicio/sesión ofrecidos por el fisioterapeuta';

-- =====================================================================
-- 2. TABLA: pacientes
-- =====================================================================
create table if not exists pacientes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    telefono text,
    email text,
    fecha_alta timestamptz not null default now(),
    notas_generales text,
    consentimiento_rgpd boolean not null default false,
    consentimiento_fecha timestamptz
);

comment on table pacientes is 'Datos de contacto e historial general de cada paciente';

-- =====================================================================
-- 3. TABLA: disponibilidad
-- Horario semanal recurrente que el fisio abre a reservas
-- =====================================================================
create table if not exists disponibilidad (
    id uuid primary key default gen_random_uuid(),
    dia_semana smallint not null check (dia_semana between 0 and 6), -- 0=domingo ... 6=sábado
    hora_inicio time not null,
    hora_fin time not null,
    activo boolean not null default true,
    check (hora_fin > hora_inicio)
);

comment on table disponibilidad is 'Franjas horarias recurrentes disponibles para reservar, por día de la semana';

-- =====================================================================
-- 4. TABLA: citas
-- =====================================================================
create table if not exists citas (
    id uuid primary key default gen_random_uuid(),
    paciente_id uuid not null references pacientes(id) on delete cascade,
    servicio_id uuid not null references servicios(id),
    fecha_hora_inicio timestamptz not null,
    fecha_hora_fin timestamptz not null,
    estado text not null default 'pendiente'
        check (estado in ('pendiente', 'confirmada', 'cancelada', 'completada')),
    token_cancelacion uuid not null default gen_random_uuid(),
    notas text,
    creado_en timestamptz not null default now(),
    check (fecha_hora_fin > fecha_hora_inicio)
);

comment on table citas is 'Citas reservadas, vinculadas a paciente y servicio';

-- Evita solapamientos de citas activas (pendiente/confirmada) en el mismo rango horario.
-- Requiere la extensión btree_gist para usar EXCLUDE con rangos de tiempo.
create extension if not exists "btree_gist";

alter table citas
    add constraint no_solapamiento_citas
    exclude using gist (
        tstzrange(fecha_hora_inicio, fecha_hora_fin) with &&
    )
    where (estado in ('pendiente', 'confirmada'));

-- Índices útiles
create index if not exists idx_citas_paciente on citas(paciente_id);
create index if not exists idx_citas_fecha on citas(fecha_hora_inicio);
create index if not exists idx_citas_token on citas(token_cancelacion);

-- =====================================================================
-- 5. TABLA: bonos
-- Paquetes de sesiones compradas por un paciente
-- =====================================================================
create table if not exists bonos (
    id uuid primary key default gen_random_uuid(),
    paciente_id uuid not null references pacientes(id) on delete cascade,
    servicio_id uuid references servicios(id),
    sesiones_totales integer not null check (sesiones_totales > 0),
    sesiones_usadas integer not null default 0 check (sesiones_usadas >= 0),
    fecha_compra timestamptz not null default now(),
    check (sesiones_usadas <= sesiones_totales)
);

comment on table bonos is 'Bonos/paquetes de sesiones prepagadas por paciente';

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
-- Modelo de acceso:
--  - "anon" (visitante público sin login): solo puede LEER servicios y disponibilidad activos.
--  - "authenticated" (el fisio, tras login con Supabase Auth): acceso completo a todo.
--  - La creación pública de citas/pacientes NO se hace con INSERT directo desde el cliente:
--    se hace a través de una Edge Function que usa la Service Role Key (que se salta RLS
--    por diseño), para poder validar disponibilidad real en el servidor antes de insertar.
-- =====================================================================

alter table servicios enable row level security;
alter table pacientes enable row level security;
alter table disponibilidad enable row level security;
alter table citas enable row level security;
alter table bonos enable row level security;

-- --- servicios: lectura pública de los activos, gestión completa solo autenticado ---
create policy "servicios_select_publico"
    on servicios for select
    to anon, authenticated
    using (activo = true);

create policy "servicios_admin_all"
    on servicios for all
    to authenticated
    using (true)
    with check (true);

-- --- disponibilidad: lectura pública de las franjas activas, gestión solo autenticado ---
create policy "disponibilidad_select_publico"
    on disponibilidad for select
    to anon, authenticated
    using (activo = true);

create policy "disponibilidad_admin_all"
    on disponibilidad for all
    to authenticated
    using (true)
    with check (true);

-- --- pacientes: sin acceso público en absoluto, solo el fisio autenticado ---
create policy "pacientes_admin_all"
    on pacientes for all
    to authenticated
    using (true)
    with check (true);

-- --- citas: sin acceso público directo; el fisio autenticado ve y gestiona todo ---
-- (la inserción pública de citas se hace vía Edge Function con Service Role Key,
--  que no pasa por estas políticas)
create policy "citas_admin_all"
    on citas for all
    to authenticated
    using (true)
    with check (true);

-- --- bonos: solo el fisio autenticado ---
create policy "bonos_admin_all"
    on bonos for all
    to authenticated
    using (true)
    with check (true);

-- =====================================================================
-- VISTA PÚBLICA: franjas_ocupadas
-- =====================================================================
-- "citas" no tiene ninguna política de SELECT para "anon" (ver notas más
-- abajo), así que el frontend NO puede leer directamente qué horas están
-- ocupadas para pintar el selector de horario — esa consulta a "citas"
-- simplemente devuelve 0 filas para un visitante público, y el selector
-- mostraría como libres huecos que en realidad ya están reservados.
--
-- Esta vista expone SOLO el rango de fecha/hora de las citas activas (sin
-- paciente, notas, ni ningún otro dato), y al crearse con este script (que
-- se ejecuta como superusuario) esquiva el RLS de "citas" igual que hace la
-- Service Role Key en las Edge Functions, sin necesidad de repartir esa key.
create or replace view franjas_ocupadas as
    select fecha_hora_inicio, fecha_hora_fin
    from citas
    where estado in ('pendiente', 'confirmada');

grant select on franjas_ocupadas to anon, authenticated;

-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================
-- 1. La tabla "citas" NO tiene política de INSERT para "anon". Esto es intencional:
--    la reserva pública debe pasar por una Supabase Edge Function que:
--      a) valide que el horario elegido sigue libre (cruzando disponibilidad + citas),
--      b) cree o reutilice el registro en "pacientes",
--      c) inserte la cita usando la Service Role Key.
--    Esto evita que cualquiera pueda leer o manipular directamente la tabla de citas
--    desde el navegador, y evita condiciones de carrera en reservas simultáneas.
--
-- 2. Igualmente, "pacientes" no tiene política de INSERT pública por el mismo motivo:
--    los datos de salud/contacto solo deben crearse desde la Edge Function controlada.
--
-- 3. La restricción "no_solapamiento_citas" a nivel de base de datos es una capa extra
--    de seguridad: aunque la Edge Function valide antes de insertar, esta constraint
--    impide físicamente que se guarden dos citas activas que se solapen en el tiempo.
--
-- 4. Recuerda configurar la Service Role Key SOLO en las variables de entorno del
--    proyecto de Supabase Edge Functions, nunca en el código del frontend en React.
--
-- 5. Por el mismo motivo del punto 1, la búsqueda y cancelación de una cita desde
--    /cancelar?token=... tampoco puede hacerse con una consulta directa desde el
--    cliente: pasa por la Edge Function "cancelar-cita", que usa la Service Role Key.
-- =====================================================================
