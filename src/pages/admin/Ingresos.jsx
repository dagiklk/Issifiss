import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Euro, CalendarCheck2, UserX } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { patientFullName } from "../../lib/clinicData.js";
import { capitalize, formatShortDate } from "../../utils/dateHelpers.js";

function formatEUR(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

function StatTile({ label, value, sub, icon: Icon, tone }) {
  return (
    <Card className="flex-1 p-4">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon size={15} strokeWidth={1.8} />
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <p className={`mt-1.5 text-[22px] font-semibold tracking-display ${tone || "text-ink"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-ink-faint">{sub}</p>}
    </Card>
  );
}

export default function Ingresos() {
  const { citas } = useAppointments();
  const [mes, setMes] = useState(() => startOfMonth(new Date()));

  const mesISO = format(mes, "yyyy-MM");
  const esMesActual = isSameMonth(mes, new Date());

  const citasDelMes = useMemo(() => citas.filter((c) => c.fecha.startsWith(mesISO)), [citas, mesISO]);
  const completadas = useMemo(
    () => citasDelMes.filter((c) => c.estado === "completada").sort((a, b) => (b.fecha + b.horaInicio).localeCompare(a.fecha + a.horaInicio)),
    [citasDelMes]
  );
  const noAsistio = citasDelMes.filter((c) => c.estado === "no_asistio");

  const ingresos = completadas.reduce((sum, c) => sum + (Number(c.precio) || 0), 0);
  const perdidoPorNoAsistio = noAsistio.reduce((sum, c) => sum + (Number(c.precio) || 0), 0);

  const historico = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => subMonths(mes, 5 - i)).map((d) => {
      const iso = format(d, "yyyy-MM");
      const total = citas
        .filter((c) => c.estado === "completada" && c.fecha.startsWith(iso))
        .reduce((sum, c) => sum + (Number(c.precio) || 0), 0);
      return { mes: d, total };
    });
  }, [citas, mes]);
  const maxTotal = Math.max(1, ...historico.map((h) => h.total));

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader title="Ingresos" />

      <div className="px-4 lg:px-8">
        <div className="mb-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setMes((m) => subMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted transition-transform duration-150 active:scale-90"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={17} strokeWidth={2} />
          </button>
          <p className="min-w-[160px] text-center text-[15px] font-semibold text-ink">
            {capitalize(format(mes, "LLLL yyyy", { locale: es }))}
          </p>
          <button
            onClick={() => setMes((m) => subMonths(m, -1))}
            disabled={esMesActual}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted transition-transform duration-150 active:scale-90 disabled:opacity-30"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={17} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-3">
          <StatTile label="Ingresos del mes" value={formatEUR(ingresos)} icon={Euro} tone="text-sage-700" />
          <StatTile label="Completadas" value={completadas.length} icon={CalendarCheck2} />
          <StatTile
            label="No asistieron"
            value={noAsistio.length}
            sub={noAsistio.length > 0 ? `${formatEUR(perdidoPorNoAsistio)} sin cobrar` : null}
            icon={UserX}
            tone={noAsistio.length > 0 ? "text-rose-600" : "text-ink"}
          />
        </div>

        <Card className="mt-4 p-5">
          <p className="mb-4 text-[13px] font-semibold text-ink">Últimos 6 meses</p>
          <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
            {historico.map(({ mes: m, total }) => (
              <div key={m.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end justify-center">
                  <div
                    className="w-7 rounded-full bg-sage-500/80 transition-[height] duration-500 ease-out"
                    style={{ height: `${Math.max((total / maxTotal) * 100, total > 0 ? 8 : 3)}%` }}
                    title={formatEUR(total)}
                  />
                </div>
                <span className="text-[10.5px] font-medium text-ink-faint">{capitalize(format(m, "LLL", { locale: es })).replace(".", "")}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6">
          <p className="mb-2.5 px-1 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">
            Sesiones completadas este mes
          </p>
          <Card className="overflow-hidden p-0">
            {completadas.length === 0 ? (
              <EmptyState
                icon={CalendarCheck2}
                title="Sin sesiones completadas"
                description="Todavía no hay ninguna sesión marcada como completada este mes."
                className="py-8"
              />
            ) : (
              completadas.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{patientFullName(c.paciente)}</p>
                    <p className="text-[12px] text-ink-muted">
                      {formatShortDate(c.fecha)} · {c.tratamiento?.nombre}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-semibold text-ink">{formatEUR(c.precio)}</p>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
