import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { patientFullName } from "../../../lib/clinicData.js";
import { formatShortDate } from "../../../utils/dateHelpers.js";
import { useAppointments } from "../../../context/AppointmentsContext.jsx";

export default function PatientCard({ patient }) {
  const navigate = useNavigate();
  const { getProxima, getUltima } = useAppointments();
  const proxima = getProxima(patient.id);
  const ultima = getUltima(patient.id);

  return (
    <button
      onClick={() => navigate(`/admin/pacientes/${patient.id}`)}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 text-left transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.985] hover:shadow-soft"
    >
      <Avatar name={patientFullName(patient)} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{patientFullName(patient)}</p>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
          {proxima
            ? `Próxima cita · ${formatShortDate(proxima.fecha)}, ${proxima.horaInicio}`
            : ultima
            ? `Última sesión · ${formatShortDate(ultima.fecha)}`
            : "Sin citas registradas"}
        </p>
      </div>
      <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-faint" />
    </button>
  );
}
