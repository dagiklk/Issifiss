import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, Clock, LogOut, Moon, Palette, Pencil } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import Card from "../../components/admin/ui/Card.jsx";
import Avatar from "../../components/admin/ui/Avatar.jsx";
import Switch from "../../components/admin/ui/Switch.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { DIAS_SEMANA } from "../../lib/clinicData.js";
import { displayNameFromSession } from "../../utils/dateHelpers.js";

function SectionTitle({ children }) {
  return <p className="mb-2 px-1 text-[12.5px] font-medium uppercase tracking-eyebrow text-ink-faint">{children}</p>;
}

function Row({ icon: Icon, label, value, action, last }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? "border-b border-line" : ""}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas-sunken text-ink-muted">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {value && <p className="truncate text-[12.5px] text-ink-muted">{value}</p>}
      </div>
      {action}
    </div>
  );
}

export default function Ajustes() {
  const { user, logout } = useAuth();
  const { disponibilidad } = useAppointments();
  const [notifs, setNotifs] = useState(true);
  const [compact, setCompact] = useState(false);
  const [dark, setDark] = useState(false);
  const name = displayNameFromSession(user);

  // Real weekly hours, sourced from the "disponibilidad" table — Monday first.
  const horario = useMemo(() => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((dow) => {
      const franjas = disponibilidad
        .filter((f) => f.dia_semana === dow)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
        .map((f) => `${f.hora_inicio.slice(0, 5)}–${f.hora_fin.slice(0, 5)}`);
      return { dia: DIAS_SEMANA[dow], franjas };
    });
  }, [disponibilidad]);

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <PageHeader title="Ajustes" />

      <div className="flex flex-col gap-6 px-4 lg:px-8">
        <div>
          <SectionTitle>Perfil</SectionTitle>
          <Card className="p-4">
            <div className="flex items-center gap-3.5">
              <Avatar name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15.5px] font-semibold text-ink">{name}</p>
                <p className="truncate text-[13px] text-ink-muted">{user?.email}</p>
              </div>
              <button
                onClick={() => toast("Edición de perfil próximamente")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-sunken text-ink-muted transition-transform duration-150 active:scale-90"
                aria-label="Editar perfil"
              >
                <Pencil size={15} strokeWidth={1.9} />
              </button>
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle>Preferencias</SectionTitle>
          <Card className="overflow-hidden p-0">
            <Row icon={Bell} label="Notificaciones" value="Nuevas citas y cancelaciones" action={<Switch checked={notifs} onChange={setNotifs} label="Notificaciones" />} />
            <Row icon={Palette} label="Modo compacto" value="Listas más densas" action={<Switch checked={compact} onChange={setCompact} label="Modo compacto" />} />
            <Row icon={Moon} label="Tema oscuro" value="Próximamente" last action={<Switch checked={dark} onChange={setDark} label="Tema oscuro" />} />
          </Card>
        </div>

        <div>
          <SectionTitle>Horario de la clínica</SectionTitle>
          <Card className="overflow-hidden p-0">
            {horario.map((d, i) => (
              <div key={d.dia} className={`flex items-center justify-between px-4 py-3 ${i < horario.length - 1 ? "border-b border-line" : ""}`}>
                <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                  <Clock size={15} strokeWidth={1.8} className="text-ink-faint" />
                  {d.dia}
                </span>
                <span className="text-[13px] text-ink-muted">{d.franjas.length ? d.franjas.join(" · ") : "Cerrado"}</span>
              </div>
            ))}
          </Card>
        </div>

        <Button variant="danger" block onClick={logout} className="mb-4">
          <LogOut size={16} strokeWidth={2} className="-ml-1" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
