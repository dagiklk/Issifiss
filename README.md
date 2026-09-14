# issifiss

Plataforma web de reservas para una consulta de fisioterapia. React + Tailwind en el
frontend, Supabase (PostgreSQL + Auth + Realtime + Edge Functions) como backend.

Incluye reserva pública de citas (como invitado o con cuenta), cancelación por enlace,
panel de administración para el fisio (agenda, pacientes, ajustes, ingresos) y cuentas
de cliente para que los pacientes habituales vean y cancelen sus propias citas sin
tener que repetir sus datos cada vez.

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta y un proyecto creado en [supabase.com](https://supabase.com)
- Supabase CLI (para desplegar las Edge Functions): `npm install -g supabase`
- Una cuenta en [resend.com](https://resend.com) si quieres los emails de aviso/confirmación

## 2. Poner en marcha la base de datos

Ejecuta estos scripts **en orden** en el SQL Editor de Supabase (Project → SQL Editor →
New query), cada uno completo de una vez:

1. `supabase/schema.sql` — tablas base (`servicios`, `pacientes`, `disponibilidad`,
   `citas`, `bonos`), RLS y la vista pública `franjas_ocupadas`.
2. `supabase/schema_cuentas_clientes.sql` — cuentas de cliente: tabla `admins`
   (lista blanca de quién es "el fisio" dentro de Supabase Auth), función `is_admin()`
   y reescritura de las políticas para que un cliente logueado solo vea/edite lo suyo.

   **Importante:** después de ejecutar este script, da de alta al fisio como
   administrador (si no, pierde el acceso al panel):

   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'tu-email-de-fisio@ejemplo.com';
   ```

   Ese usuario se crea en **Authentication → Users → Add user**.

3. `supabase/schema_vincular_paciente_existente.sql` — función `claim_paciente_by_email()`
   para enlazar, al confirmar el email de una cuenta nueva, un paciente que ya hubiera
   reservado como invitado con ese mismo email.
4. `supabase/schema_ingresos.sql` — estado de cita `no_asistio` y precio histórico por
   cita (`citas.precio`), para que la pantalla de Ingresos no cambie con efecto
   retroactivo si luego editas el precio de un servicio.
5. `supabase/schema_confirmar_cita.sql` — columna `citas.token_confirmacion`, para el
   enlace de confirmación de un clic que recibe el fisio en el email de nueva cita.

Después:

- Comprueba en **Table Editor** que se han creado las tablas y la tabla `admins` tiene
  a tu usuario.
- Añade manualmente algún registro de ejemplo en `servicios` y `disponibilidad` para
  poder probar el flujo de reserva.
- En **Authentication → Settings**, revisa si quieres confirmación de email obligatoria
  para las cuentas de cliente (`Confirm email`). Si la activas, una cuenta nueva no
  tiene sesión inmediata al registrarse — el frontend ya contempla ese caso.

## 3. Configurar las variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con los valores de **Project Settings → API** de tu proyecto de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica
```

Esta es la clave pública (`anon`) pensada para el navegador — el acceso a los datos
reales lo controla RLS en la base de datos, no el secreto de esta clave. **Nunca**
pongas aquí la `service_role` key.

## 4. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

La web quedará disponible en `http://localhost:5173`.

**Rutas públicas**
- `/` → landing page
- `/reservar` → flujo de reserva (invitado o con cuenta)
- `/cancelar?token=...` → cancelación vía enlace único

**Cuenta de cliente**
- `/cuenta/login`, `/cuenta/registro` → acceso/alta de pacientes habituales
- `/cuenta/recuperar`, `/cuenta/restablecer` → recuperación de contraseña
- `/cuenta` → datos propios e historial de citas (protegido, requiere sesión)

**Panel del fisio** (protegido, requiere sesión + estar en la tabla `admins`)
- `/admin/login` → acceso del fisio
- `/admin` → panel general
- `/admin/agenda` → vista de agenda por día/semana
- `/admin/citas`, `/admin/citas/nueva` → listado y alta manual de citas
- `/admin/pacientes`, `/admin/pacientes/:id` → fichas de pacientes, notas e historial
- `/admin/ajustes` → servicios y horario de disponibilidad
- `/admin/ingresos` → ingresos por mes a partir de las citas completadas

## 5. Desplegar las Edge Functions

La creación y cancelación de citas, y el aviso de confirmación, pasan por Edge
Functions para poder validar disponibilidad en el servidor y evitar exponer permisos
de escritura/lectura directos sobre `citas`/`pacientes` desde el navegador (esas
tablas no tienen políticas RLS para `anon`, a propósito).

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy crear-cita
supabase functions deploy cancelar-cita
supabase functions deploy notificar-confirmacion
supabase functions deploy confirmar-cita
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

La Service Role Key la encuentras en **Project Settings → API → service_role**.
**Nunca** la pongas en el código del frontend ni en el archivo `.env` del navegador:
solo debe vivir como secret de las Edge Functions.

- `crear-cita` — valida disponibilidad, crea/reutiliza el paciente y la cita.
- `cancelar-cita` — busca y cancela una cita por `token_cancelacion`.
- `notificar-confirmacion` — envía el email de "cita confirmada" cuando el fisio
  confirma una cita desde el panel (comprueba `is_admin()` con el token de quien llama).
- `confirmar-cita` — busca (GET) y confirma (POST) una cita por `token_confirmacion`,
  avisando al paciente por email al confirmarla. La usa la página del frontend
  `/confirmar?token=...` (igual que `/cancelar` usa `cancelar-cita`): el email de
  nueva solicitud enlaza ahí, no a la función directamente, porque Supabase fuerza
  `Content-Type: text/plain` en lo que devuelven las Edge Functions y una página HTML
  servida desde ahí no se renderizaría en el navegador.

### Notificaciones por email (Resend)

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
supabase secrets set EMAIL_FISIO=email_del_fisio@ejemplo.com
supabase secrets set SITE_URL=https://tu-dominio.com
```

- `RESEND_API_KEY`: obténla en [resend.com/api-keys](https://resend.com/api-keys).
- `EMAIL_FISIO`: a dónde llegan los avisos de nueva cita / cancelación.
- `SITE_URL`: dominio público del frontend, se usa para construir el enlace de
  cancelación (`SITE_URL/cancelar?token=...`). Si no se configura, usa
  `http://localhost:5173`.
- `RESEND_FROM` (opcional): remitente, por defecto `issifiss <onboarding@resend.dev>`.
  Mientras no verifiques un dominio propio en Resend, los emails solo llegarán a la
  cuenta con la que te registraste — verifica tu dominio en Resend antes de pasar a
  producción.

Si el envío a Resend falla por cualquier motivo, la reserva/cancelación/confirmación
no se ve afectada: solo se pierde el aviso por email.

## 6. Estructura del proyecto

```
src/
  lib/
    supabaseClient.js          Cliente único de Supabase
    clientePaciente.js         Obtiene/crea la ficha de paciente del cliente logueado
    clinicData.js               Adaptadores entre filas de Supabase y los modelos de UI
  context/
    AuthContext.jsx             Sesión (fisio o cliente) + comprobación is_admin()
    AppointmentsContext.jsx     Datos del panel: citas, pacientes, servicios, disponibilidad
  routes/
    ProtectedRoute.jsx          Protección de /admin/* (sesión + is_admin())
    ClientProtectedRoute.jsx    Protección de /cuenta (sesión)
  components/                   Navbar, Footer, ServicioCard, SelectorHorario, FormularioPaciente
  components/admin/             UI, layout y componentes del panel (agenda, pacientes, ajustes)
  pages/                        Home, Reservar, Cancelar
  pages/cliente/                Login, Registro, MiCuenta, recuperación de contraseña
  pages/admin/                  Login, Panel, Agenda, Citas, Pacientes, Ajustes, Ingresos
supabase/
  schema.sql                          Tablas base + RLS + vista pública franjas_ocupadas
  schema_cuentas_clientes.sql          Cuentas de cliente + lista blanca de administradores
  schema_vincular_paciente_existente.sql  Enlazar cuenta nueva con reserva de invitado previa
  schema_ingresos.sql                  Estado "no_asistio" + precio histórico por cita
  schema_confirmar_cita.sql            Columna token_confirmacion para el enlace de un clic
  functions/crear-cita/                Valida disponibilidad, crea/reutiliza paciente y cita
  functions/cancelar-cita/             Busca y cancela una cita por token
  functions/notificar-confirmacion/    Avisa al paciente cuando el fisio confirma su cita
  functions/confirmar-cita/            Confirma una cita por token desde el email al fisio
  functions/_shared/                   Helper compartido para enviar emails con Resend
```

## 7. Modelo de acceso (resumen)

- **Visitante anónimo:** puede leer `servicios`/`disponibilidad` activos y la vista
  `franjas_ocupadas` (solo fecha/hora, sin datos del paciente). Reserva y cancela
  siempre a través de las Edge Functions, nunca escribiendo directo en las tablas.
- **Cliente con cuenta:** solo ve/edita su propia fila en `pacientes` y sus propias
  `citas` (RLS por `user_id = auth.uid()`).
- **Fisio (administrador):** cualquier usuario de Supabase Auth dado de alta en la
  tabla `admins` tiene acceso completo, verificado en base de datos con `is_admin()`
  — el frontend solo usa esa misma comprobación para decidir qué mostrar, nunca para
  decidir qué se permite escribir.

## 8. Pendiente / próximos pasos

- Recordatorios automáticos antes de la cita y notificaciones por SMS (Twilio) — no
  incluidos todavía; los emails con Resend sí están implementados.
- Página de política de privacidad y aviso legal.
- Facturación (VeriFactu) — fuera del alcance de esta primera versión.
- Protección anti-spam (rate limiting / captcha) en el formulario público de reserva.
