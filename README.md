# issifiss

Plataforma web de reservas para una consulta de fisioterapia. React + Bootstrap en el
frontend, Supabase (PostgreSQL + Auth + Realtime) como backend.

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta y un proyecto creado en [supabase.com](https://supabase.com)
- Supabase CLI (opcional, solo para desplegar la Edge Function): `npm install -g supabase`

## 2. Poner en marcha la base de datos

1. Entra en tu proyecto de Supabase → **SQL Editor** → **New query**
2. Pega el contenido de `supabase/schema.sql` y ejecútalo completo
3. Comprueba en **Table Editor** que se han creado las tablas: `servicios`,
   `pacientes`, `disponibilidad`, `citas`, `bonos`
4. Añade manualmente algún registro de ejemplo en `servicios` y `disponibilidad`
   para poder probar el flujo de reserva
5. Crea un usuario para el panel de administración en **Authentication → Users → Add user**
   (ese email/contraseña serán los que use tu primo para entrar en `/admin/login`)

## 3. Configurar las variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con los valores de **Project Settings → API** de tu proyecto de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica
```

## 4. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

La web quedará disponible en `http://localhost:5173`.

- `/` → landing page
- `/reservar` → flujo de reserva público
- `/cancelar?token=...` → cancelación vía enlace único
- `/admin/login` → acceso del fisio
- `/admin/panel` → agenda de citas (protegido)
- `/admin/pacientes` → fichas de pacientes y bonos (protegido)

## 5. Desplegar las Edge Functions (crear-cita, cancelar-cita)

La creación y cancelación de citas pasan por Edge Functions para validar
disponibilidad en el servidor y evitar exponer permisos de escritura/lectura
directos sobre `citas` desde el navegador (la tabla no tiene políticas RLS
para `anon`, a propósito).

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy crear-cita
supabase functions deploy cancelar-cita
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

La Service Role Key la encuentras en **Project Settings → API → service_role**.
**Nunca** la pongas en el archivo `.env` del frontend.

### Notificaciones por email (Resend)

Al crear o cancelar una cita, las Edge Functions avisan por email usando
[Resend](https://resend.com):

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
supabase secrets set EMAIL_FISIO=email_del_fisio@ejemplo.com
supabase secrets set SITE_URL=https://tu-dominio.com
```

- `RESEND_API_KEY`: obténla en [resend.com/api-keys](https://resend.com/api-keys).
- `EMAIL_FISIO`: a dónde llegan los avisos de nueva cita / cancelación.
- `SITE_URL`: dominio público del frontend, se usa para construir el enlace
  de cancelación (`SITE_URL/cancelar?token=...`) que recibe el paciente. Si
  no se configura, usa `http://localhost:5173`.
- `RESEND_FROM` (opcional): remitente, por defecto `issifiss <onboarding@resend.dev>`.
  Mientras no verifiques un dominio propio en Resend, los emails solo llegarán
  a la cuenta con la que te registraste — verifica tu dominio en Resend antes
  de pasar a producción.

Si el paciente indica un email al reservar, también recibe la confirmación
con el enlace para cancelar su cita. Si el envío a Resend falla por cualquier
motivo, la reserva/cancelación no se ve afectada: solo se pierde el aviso.

## 6. Estructura del proyecto

```
src/
  lib/supabaseClient.js       Cliente único de Supabase
  context/AuthContext.jsx     Sesión del fisio (Supabase Auth)
  routes/ProtectedRoute.jsx   Protección de rutas /admin/*
  components/                 Navbar, Footer, ServicioCard, SelectorHorario, FormularioPaciente
  pages/                      Home, Reservar, Cancelar
  pages/admin/                Login, Panel, Pacientes
supabase/
  schema.sql                  Tablas + RLS + vista pública para pegar en el SQL Editor
  functions/crear-cita/       Edge Function que valida y crea la cita, y notifica por email
  functions/cancelar-cita/    Edge Function que busca y cancela una cita por token
  functions/_shared/          Helper compartido para enviar emails con Resend
```

## 7. Pendiente / próximos pasos

- Recordatorios automáticos antes de la cita y notificaciones por SMS
  (Twilio) — no incluidos todavía; los emails de confirmación/cancelación
  con Resend sí están implementados
- Página de política de privacidad y aviso legal
- Facturación (VeriFactu) — fuera del alcance de esta primera versión
