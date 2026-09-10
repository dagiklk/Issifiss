import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { CalendarCheck, CalendarPlus, ChevronRight, Search, Sparkles, Users2, Clock3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { patientFullName } from "../../lib/clinicData.js";
import { displayNameFromSession, formatLongDate, formatWeekdayShort, greetingForHour, toISODate } from "../../utils/dateHelpers.js";
import Avatar from "../../components/admin/ui/Avatar.jsx";
import StatusBadge from "../../components/admin/ui/StatusBadge.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Sheet from "../../components/admin/ui/Sheet.jsx";
import AppointmentDetail from "../../components/admin/appointments/AppointmentDetail.jsx";
import AppointmentCard from "../../components/admin/appointments/AppointmentCard.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";

function StatTile({ label, value, icon: Icon }) {
  return (
    <Card className="flex-1 p-4">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon size={15} strokeWidth={1.8} />
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-[24px] font-semibold tracking-display text-ink">{value}</p>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-line bg-white py-4 transition-[transform,box-shadow] duration-150 ease-out active:scale-95 hover:shadow-soft"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-700">
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
    </button>
  );
}

export default function Panel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getByFecha, updateStatus, slotsForDate } = useAppointments();
  const [openCita, setOpenCita] = useState(null);

  const today = toISODate(new Date());
  const nowHHmm = format(new Date(), "HH:mm");
  const name = displayNameFromSession(user);

  const todays = useMemo(
    () => getByFecha(today).filter((c) => c.estado !== "cancelada").sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [getByFecha, today]
  );
  const next = todays.find((c) => c.horaInicio >= nowHHmm && c.estado !== "completada");
  const pacientesHoy = new Set(todays.map((c) => c.pacienteId)).size;
  const slotsHoy = slotsForDate(today, 30).length;
  const libresHoy = Math.max(slotsHoy - todays.length, 0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekCounts = weekDays.map((d) => {
    const iso = toISODate(d);
    return { day: d, count: getByFecha(iso).filter((c) => c.estado !== "cancelada").length };
  });
  const maxCount = Math.max(1, ...weekCounts.map((w) => w.count));

  const actividad = todays.filter((c) => c.estado === "completada").slice(-4).reverse();

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-8 lg:pt-8">
        <p className="text-[13.5px] font-medium text-sage-600">{greetingForHour()}, {name}</p>
        <h1 className="mt-0.5 font-display text-[26px] font-semibold tracking-display text-ink lg:text-[30px]">
          {formatLongDate(today)}
        </h1>
      </div>

      {/* Next appointment */}
      <div className="mt-5 px-4 lg:px-8">
        <p className="mb-2 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">Tu próxima cita</p>
        {next ? (
          <button
            onClick={() => setOpenCita(next)}
            className="flex w-full items-center gap-4 rounded-3xl bg-ink p-5 text-left shadow-raised transition-transform duration-150 ease-out active:scale-[0.985]"
          >
            <Avatar name={patientFullName(next.paciente)} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-semibold text-white">{patientFullName(next.paciente)}</p>
              <p className="mt-0.5 text-[13.5px] text-white/60">{next.tratamiento?.nombre}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-white">
                  {next.horaInicio}
                </span>
                <StatusBadge status={next.estado} className="bg-white/10 text-white [&>span]:bg-white" />
              </div>
            </div>
            <ChevronRight size={20} className="shrink-0 text-white/50" />
          </button>
        ) : (
          <Card className="p-5">
            <EmptyState
              icon={CalendarCheck}
              title="Sin más citas hoy"
              description="Tu agenda de hoy está completa. Buen trabajo."
              className="py-4"
            />
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="mt-5 flex gap-3 px-4 lg:px-8">
        <StatTile label="Citas hoy" value={todays.length} icon={Sparkles} />
        <StatTile label="Pacientes" value={pacientesHoy} icon={Users2} />
        <StatTile label="Huecos libres" value={libresHoy} icon={Clock3} />
      </div>

      {/* Quick actions */}
      <div className="mt-5 flex gap-3 px-4 lg:px-8">
        <QuickAction icon={CalendarPlus} label="Nueva cita" onClick={() => navigate("/admin/citas/nueva")} />
        <QuickAction icon={CalendarCheck} label="Ver agenda" onClick={() => navigate("/admin/agenda")} />
        <QuickAction icon={Search} label="Pacientes" onClick={() => navigate("/admin/pacientes")} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 px-4 lg:grid-cols-2 lg:px-8">
        {/* Weekly overview */}
        <Card className="p-5">
          <p className="mb-4 text-[13px] font-semibold text-ink">Resumen semanal</p>
          <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
            {weekCounts.map(({ day, count }) => (
              <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className="w-5 rounded-full bg-sage-500/80 transition-[height] duration-500 ease-out"
                    style={{ height: `${Math.max((count / maxCount) * 100, count > 0 ? 12 : 4)}%` }}
                  />
                </div>
                <span className="text-[10.5px] font-medium text-ink-faint">{formatWeekdayShort(day)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-5">
          <p className="mb-3 text-[13px] font-semibold text-ink">Actividad reciente</p>
          {actividad.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">Aún no hay sesiones completadas hoy.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {actividad.map((c) => (
                <AppointmentCard key={c.id} cita={c} compact onClick={() => setOpenCita(c)} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Sheet open={!!openCita} onOpenChange={(v) => !v && setOpenCita(null)} title="Detalle de la cita">
        {openCita && <AppointmentDetail cita={openCita} onClose={() => setOpenCita(null)} onStatusChange={updateStatus} />}
      </Sheet>
    </div>
  );
}
