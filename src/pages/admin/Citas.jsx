import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarSearch, Plus } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Tabs from "../../components/admin/ui/Tabs.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import SearchInput from "../../components/admin/ui/SearchInput.jsx";
import Sheet from "../../components/admin/ui/Sheet.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";
import AppointmentCard from "../../components/admin/appointments/AppointmentCard.jsx";
import AppointmentDetail from "../../components/admin/appointments/AppointmentDetail.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { capitalize, formatLongDate, toISODate } from "../../utils/dateHelpers.js";
import { patientFullName } from "../../lib/clinicData.js";

const ESTADOS = [
  { value: "todas", label: "Todas" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "completada", label: "Completadas" },
  { value: "no_asistio", label: "No asistió" },
  { value: "cancelada", label: "Canceladas" },
];

export default function Citas() {
  const navigate = useNavigate();
  const { citas, updateStatus } = useAppointments();
  const [tab, setTab] = useState("hoy");
  const [estado, setEstado] = useState("todas");
  const [query, setQuery] = useState("");
  const [openCita, setOpenCita] = useState(null);

  const today = toISODate(new Date());

  const filtered = useMemo(() => {
    let list = citas;
    if (tab === "hoy") list = list.filter((c) => c.fecha === today);
    if (tab === "proximas") list = list.filter((c) => c.fecha > today || (c.fecha === today));
    if (tab === "pasadas") list = list.filter((c) => c.fecha < today);
    if (estado !== "todas") list = list.filter((c) => c.estado === estado);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) => patientFullName(c.paciente).toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
    return tab === "pasadas" ? sorted.reverse() : sorted;
  }, [citas, tab, estado, query, today]);

  const counts = {
    hoy: citas.filter((c) => c.fecha === today).length,
    proximas: citas.filter((c) => c.fecha >= today).length,
    pasadas: citas.filter((c) => c.fecha < today).length,
  };

  const grouped = useMemo(() => {
    if (tab === "hoy") return [{ label: null, items: filtered }];
    const byDate = new Map();
    filtered.forEach((c) => {
      if (!byDate.has(c.fecha)) byDate.set(c.fecha, []);
      byDate.get(c.fecha).push(c);
    });
    return Array.from(byDate.entries()).map(([fecha, items]) => ({ label: capitalize(formatLongDate(fecha)), items }));
  }, [filtered, tab]);

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader
        title="Citas"
        actions={
          <Button variant="accent" size="sm" onClick={() => navigate("/admin/citas/nueva")}>
            <Plus size={15} strokeWidth={2.4} className="-ml-0.5" />
            <span className="hidden sm:inline">Nueva cita</span>
          </Button>
        }
      />

      <div className="px-4 pb-3 lg:px-8">
        <Tabs
          items={[
            { value: "hoy", label: "Hoy", count: counts.hoy },
            { value: "proximas", label: "Próximas", count: counts.proximas },
            { value: "pasadas", label: "Pasadas", count: counts.pasadas },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="px-4 pb-3 lg:px-8">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente" />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 lg:px-8">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setEstado(e.value)}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150",
              estado === e.value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-muted hover:border-line-strong"
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="px-4 lg:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title="Sin resultados"
            description="No hay citas que coincidan con estos filtros."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map((group, i) => (
              <div key={group.label || i}>
                {group.label && <p className="mb-2 text-[12.5px] font-medium text-ink-faint">{group.label}</p>}
                <div className="flex flex-col gap-2">
                  {group.items.map((c) => (
                    <AppointmentCard key={c.id} cita={c} onClick={() => setOpenCita(c)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!openCita} onOpenChange={(v) => !v && setOpenCita(null)} title="Detalle de la cita">
        {openCita && <AppointmentDetail cita={openCita} onClose={() => setOpenCita(null)} onStatusChange={updateStatus} />}
      </Sheet>
    </div>
  );
}
