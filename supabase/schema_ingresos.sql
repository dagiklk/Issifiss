-- =====================================================================
-- ISSIFISS · Estado "no asistió" + precio histórico por cita (ingresos)
-- -----------------------------------------------------------------------
-- Instrucciones: pega y ejecuta esto en el SQL Editor de Supabase.
--
-- Por qué hace falta:
-- 1. No existía forma de marcar que un cliente con cita confirmada no se
--    presentó — solo había "cancelada" (que normalmente implica que el
--    cliente avisó antes) y "completada". Se añade el estado "no_asistio"
--    para poder distinguirlo y no contarlo como ingreso.
-- 2. Los ingresos por mes se calculan sumando el precio de las citas
--    "completada". Si ese precio se lee siempre del servicio actual
--    (tabla "servicios"), en cuanto el fisio cambie un precio desde
--    Ajustes, los ingresos de meses ya cerrados cambiarían con efecto
--    retroactivo. Por eso "citas" guarda ahora su propio "precio",
--    fijado en el momento de la reserva, para que el histórico no se
--    mueva si el precio del servicio cambia después.
-- =====================================================================

alter table citas drop constraint if exists citas_estado_check;
alter table citas add constraint citas_estado_check
    check (estado in ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'));

alter table citas add column if not exists precio numeric(10,2);

-- Relleno inicial para citas que ya existían antes de este cambio: usamos
-- el precio actual de su servicio, que es la mejor aproximación posible
-- (si ese precio ya cambió desde que se reservaron, esto no se puede
-- recuperar con exactitud).
update citas
set precio = servicios.precio
from servicios
where citas.servicio_id = servicios.id
  and citas.precio is null;

comment on column citas.precio is
  'Precio cobrado por esta cita, fijado en el momento de crearla. No cambia si luego se edita el precio del servicio.';
