import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDays, addWeeks, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Tabs from "../../components/admin/ui/Tabs.jsx";
import IconButton from "../../components/admin/ui/IconButton.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Sheet from "../../components/admin/ui/Sheet.jsx";
import DateStrip from "../../components/admin/appointments/DateStrip.jsx";
import DayAgenda from "../../components/admin/appointments/DayAgenda.jsx";
import WeekColumns from "../../components/admin/appointments/WeekColumns.jsx";
import AppointmentDetail from "../../components/admin/appointments/AppointmentDetail.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { capitalize, formatLongDate, toISODate } from "../../utils/dateHelpers.js";

export default function Agenda() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateStatus } = useAppointments();
  const [view, setView] = useState("dia");
  const [selected, setSelected] = useState(location.state?.fecha || toISODate(new Date()));
  const [openCita, setOpenCita] = useState(null);

  const today = toISODate(new Date());
  const selectedDate = parseISO(selected);

  function shiftDay(n) {
    setSelected(toISODate(addDays(selectedDate, n)));
  }
  function shiftWeek(n) {
    setSelected(toISODate(addWeeks(selectedDate, n)));
  }
  function newAt(fecha, hora) {
    navigate("/admin/citas/nueva", { state: { fecha, hora } });
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM", { locale: es })}`;

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader
        title="Agenda"
        actions={
          <Button variant="accent" size="sm" onClick={() => navigate("/admin/citas/nueva")} className="hidden sm:inline-flex">
            <Plus size={15} strokeWidth={2.4} className="-ml-0.5" />
            Nueva cita
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3 px-4 pb-3 lg:px-8">
        <Tabs
          items={[
            { value: "dia", label: "Día" },
            { value: "semana", label: "Semana" },
          ]}
          value={view}
          onChange={setView}
        />
        <IconButton
          aria-label="Nueva cita"
          variant="accent"
          onClick={() => navigate("/admin/citas/nueva")}
          className="sm:hidden"
        >
          <Plus size={18} strokeWidth={2.3} />
        </IconButton>
      </div>

      {view === "dia" ? (
        <>
          <DateStrip selected={selected} onSelect={setSelected} />
          <div className="flex items-center justify-between px-4 pb-3 pt-4 lg:px-8">
            <h2 className="text-[15px] font-semibold text-ink">{capitalize(formatLongDate(selected))}</h2>
            <div className="flex items-center gap-1.5">
              {selected !== today && (
                <button onClick={() => setSelected(today)} className="mr-1 text-[12.5px] font-medium text-sage-600">
                  Hoy
                </button>
              )}
              <IconButton aria-label="Día anterior" size="sm" variant="solid" onClick={() => shiftDay(-1)}>
                <ChevronLeft size={16} strokeWidth={2.2} />
              </IconButton>
              <IconButton aria-label="Día siguiente" size="sm" variant="solid" onClick={() => shiftDay(1)}>
                <ChevronRight size={16} strokeWidth={2.2} />
              </IconButton>
            </div>
          </div>
          <DayAgenda
            fecha={selected}
            isToday={selected === today}
            nowHHmm={format(new Date(), "HH:mm")}
            onOpenCita={setOpenCita}
            onNewAt={newAt}
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pb-3 pt-1 lg:px-8">
            <h2 className="text-[15px] font-semibold capitalize text-ink">{weekLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSelected(today)} className="mr-1 text-[12.5px] font-medium text-sage-600">
                Esta semana
              </button>
              <IconButton aria-label="Semana anterior" size="sm" variant="solid" onClick={() => shiftWeek(-1)}>
                <ChevronLeft size={16} strokeWidth={2.2} />
              </IconButton>
              <IconButton aria-label="Semana siguiente" size="sm" variant="solid" onClick={() => shiftWeek(1)}>
                <ChevronRight size={16} strokeWidth={2.2} />
              </IconButton>
            </div>
          </div>
          <WeekColumns
            selected={selected}
            onSelectDay={(iso) => {
              setSelected(iso);
              setView("dia");
            }}
            onOpenCita={setOpenCita}
          />
        </>
      )}

      <Sheet open={!!openCita} onOpenChange={(v) => !v && setOpenCita(null)} title="Detalle de la cita">
        {openCita && <AppointmentDetail cita={openCita} onClose={() => setOpenCita(null)} onStatusChange={updateStatus} />}
      </Sheet>
    </div>
  );
}
