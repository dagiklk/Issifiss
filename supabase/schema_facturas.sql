-- =====================================================================
-- ISSIFISS · Facturación de sesiones completadas
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase, DESPUÉS
-- de supabase/schema_cuentas_clientes.sql (usa is_admin()).
--
-- Por qué existe:
-- Al marcar una cita como completada, el panel ofrece generar la factura
-- de esa sesión (PDF descargable) pidiendo solo la forma de pago — el
-- resto de datos (cliente, concepto, importe) se rellenan solos desde la
-- propia cita. Para eso hacen falta: el DNI/NIF del paciente (que hasta
-- ahora no se guardaba en ningún sitio) y un registro de las facturas
-- emitidas, con una numeración secuencial por año que no se pueda repetir
-- ni saltar aunque dos se generen a la vez.
-- =====================================================================

-- =====================================================================
-- 1. DNI/NIF del paciente
-- =====================================================================
alter table pacientes add column if not exists dni text;

comment on column pacientes.dni is 'DNI/NIF del paciente, para rellenar sus facturas automáticamente. Se pide al registrarse como cliente, y si falta, se pide (y se guarda) al generar su primera factura desde el panel.';

-- =====================================================================
-- 2. CONTADOR DE NUMERACIÓN (una fila por año: "2026" -> siguiente nº)
-- =====================================================================
create table if not exists facturas_contador (
    anio text primary key,
    siguiente integer not null default 1
);

comment on table facturas_contador is 'Siguiente número de factura a usar, por año (ej. 2026 -> 7 significa que la próxima factura de 2026 será 2026-007). Solo la toca crear_factura() con un SELECT ... FOR UPDATE, para que dos facturas generadas a la vez nunca puedan repetir número.';

alter table facturas_contador enable row level security;
-- Solo se lee/escribe desde dentro de crear_factura() (security definer);
-- no hace falta ninguna política de select/insert/update.

-- =====================================================================
-- 3. TABLA: facturas
-- =====================================================================
-- numero/nombre_cliente/dni_cliente se guardan como snapshot del momento
-- de emisión (no un JOIN en vivo a pacientes): si el paciente cambia de
-- nombre o corrige su DNI más adelante, las facturas ya emitidas no deben
-- cambiar retroactivamente.
create table if not exists facturas (
    id uuid primary key default gen_random_uuid(),
    numero text not null unique,
    cita_id uuid not null unique references citas(id) on delete restrict,
    paciente_id uuid not null references pacientes(id) on delete restrict,
    fecha date not null default current_date,
    concepto text not null,
    importe numeric(10,2) not null,
    forma_pago text not null check (forma_pago in ('bizum', 'transferencia', 'efectivo')),
    nombre_cliente text not null,
    dni_cliente text not null,
    creado_en timestamptz not null default now()
);

comment on table facturas is 'Facturas emitidas al completar una sesión. "cita_id" es UNIQUE a propósito: cada cita solo puede facturarse una vez.';

create index if not exists idx_facturas_paciente on facturas(paciente_id);

alter table facturas enable row level security;

create policy "facturas_admin_all"
    on facturas for all
    to authenticated
    using (is_admin())
    with check (is_admin());

create policy "facturas_propias_select"
    on facturas for select
    to authenticated
    using (paciente_id in (select id from pacientes where user_id = auth.uid()));

-- =====================================================================
-- 4. FUNCIÓN: crear_factura
-- =====================================================================
-- Hace, en una sola llamada atómica:
--  a) reserva el siguiente número del año en curso (bloqueando esa fila
--     del contador, no toda la tabla, así que facturar dos citas distintas
--     a la vez no se bloquea entre sí más que el instante de reservar nº),
--  b) calcula concepto/importe/nombre desde la propia cita en el servidor
--     (nunca se confía en lo que mande el cliente para el importe),
--  c) inserta la factura,
--  d) si el paciente todavía no tenía DNI guardado, lo guarda ahora.
create or replace function crear_factura(
    p_cita_id uuid,
    p_forma_pago text,
    p_dni_cliente text
)
returns facturas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid;
  v_nombre_cliente text;
  v_concepto text;
  v_importe numeric;
  v_anio text := to_char(now(), 'YYYY');
  v_siguiente int;
  v_numero text;
  v_factura facturas;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_forma_pago not in ('bizum', 'transferencia', 'efectivo') then
    raise exception 'Forma de pago no válida';
  end if;

  if p_dni_cliente is null or btrim(p_dni_cliente) = '' then
    raise exception 'Falta el DNI/NIF del cliente';
  end if;

  select c.paciente_id, p.nombre, s.nombre, coalesce(c.precio, s.precio)
    into v_paciente_id, v_nombre_cliente, v_concepto, v_importe
    from citas c
    join pacientes p on p.id = c.paciente_id
    join servicios s on s.id = c.servicio_id
    where c.id = p_cita_id;

  if v_paciente_id is null then
    raise exception 'Cita no encontrada';
  end if;
  if v_importe is null then
    raise exception 'Esta sesión no tiene un precio asignado';
  end if;

  insert into facturas_contador (anio, siguiente) values (v_anio, 1)
    on conflict (anio) do nothing;

  select siguiente into v_siguiente
    from facturas_contador
    where anio = v_anio
    for update;

  update facturas_contador set siguiente = siguiente + 1 where anio = v_anio;

  v_numero := v_anio || '-' || lpad(v_siguiente::text, 3, '0');

  insert into facturas (numero, cita_id, paciente_id, concepto, importe, forma_pago, nombre_cliente, dni_cliente)
  values (v_numero, p_cita_id, v_paciente_id, v_concepto, v_importe, p_forma_pago, v_nombre_cliente, btrim(upper(p_dni_cliente)))
  returning * into v_factura;

  update pacientes
    set dni = btrim(upper(p_dni_cliente))
    where id = v_paciente_id and (dni is null or btrim(dni) = '');

  return v_factura;
end;
$$;

comment on function crear_factura(uuid, text, text) is
  'Genera la siguiente factura del año en curso de forma atómica (numeración sin huecos ni repeticiones) a partir de una cita completada. Usada por AppointmentsContext.generarFactura al marcar una cita como completada desde el panel.';

grant execute on function crear_factura(uuid, text, text) to authenticated;
