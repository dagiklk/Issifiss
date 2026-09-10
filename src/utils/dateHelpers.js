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

export function calcAge(fechaNacimientoISO) {
  const dob = parseISO(fechaNacimientoISO);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
