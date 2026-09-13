import { es } from "date-fns/locale";
import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

export function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// "martes, 10 de septiembre"
export function formatLongDate(dateOrISO) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: es }));
}

// "10 sept"
export function formatShortDate(dateOrISO) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  return capitalize(format(date, "d MMM", { locale: es }));
}

// "12 de abril de 1991" — used where the year matters (birth date, join date)
export function formatDateWithYear(dateOrISO) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatWeekdayShort(dateOrISO) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  return capitalize(format(date, "EEE", { locale: es })).replace(".", "");
}

export function relativeDayLabel(dateOrISO) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  if (isYesterday(date)) return "Ayer";
  return formatLongDate(date);
}

export function toISODate(date) {
  return format(date, "yyyy-MM-dd");
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function displayNameFromSession(user) {
  const meta = user?.user_metadata || {};
  if (meta.full_name) return meta.full_name.split(" ")[0];
  if (meta.name) return meta.name.split(" ")[0];
  if (user?.email) {
    const local = user.email.split("@")[0].replace(/[._-]+/g, " ");
    return capitalize(local.split(" ")[0]);
  }
  return "Equipo";
}

// True if "HH:MM" on the given day (Date or "yyyy-MM-dd") is already in the past.
export function isPastSlot(dateOrISO, horaStr) {
  const date = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  const [h, m] = horaStr.split(":").map(Number);
  const slot = new Date(date);
  slot.setHours(h, m, 0, 0);
  return slot.getTime() < Date.now();
}

// Convierte una hora local de la clínica ("YYYY-MM-DD", "HH:MM", zona horaria
// de la clínica) a un Date UTC real, sin depender de la zona horaria del
// dispositivo del fisio — igual que hace la Edge Function "crear-cita" en el
// servidor. Sin esto, si el panel se abre desde un dispositivo configurado en
// otra zona horaria (viaje, reloj mal ajustado...), una cita creada para las
// "10:00" quedaría guardada en un instante UTC distinto al que corresponde a
// las 10:00 en Madrid.
export function zonedTimeToUtc(fechaISO, horaHHMM, timeZone = "Europe/Madrid") {
  const [year, month, day] = fechaISO.split("-").map(Number);
  const [hour, minute] = horaHHMM.split(":").map(Number);
  // Punto de partida: tratamos los valores deseados como si ya fueran UTC.
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Vemos qué hora muestra ESE instante en la zona de la clínica...
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(guess);
  const obtener = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
  const mostrado = Date.UTC(
    obtener("year"),
    obtener("month") - 1,
    obtener("day"),
    obtener("hour"),
    obtener("minute"),
    obtener("second")
  );

  // ...y corregimos el guess por la diferencia. Dos pasadas por si el ajuste
  // cruza un cambio de horario de verano/invierno justo en ese instante.
  let resultado = new Date(guess.getTime() + (guess.getTime() - mostrado));
  const partes2 = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(resultado);
  const obtener2 = (tipo) => Number(partes2.find((p) => p.type === tipo)?.value);
  const mostrado2 = Date.UTC(
    obtener2("year"),
    obtener2("month") - 1,
    obtener2("day"),
    obtener2("hour"),
    obtener2("minute"),
    obtener2("second")
  );
  resultado = new Date(resultado.getTime() + (guess.getTime() - mostrado2));

  return resultado;
}

export function calcAge(fechaNacimientoISO) {
  const dob = parseISO(fechaNacimientoISO);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
