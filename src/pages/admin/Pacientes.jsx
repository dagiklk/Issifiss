import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users } from "lucide-react";
import PageHeader from "../../components/admin/layout/PageHeader.jsx";
import SearchInput from "../../components/admin/ui/SearchInput.jsx";
import EmptyState from "../../components/admin/ui/EmptyState.jsx";
import PatientCard from "../../components/admin/patients/PatientCard.jsx";
import Button from "../../components/admin/ui/Button.jsx";
import Sheet from "../../components/admin/ui/Sheet.jsx";
import { patientFullName } from "../../lib/clinicData.js";
import { useAppointments } from "../../context/AppointmentsContext.jsx";

export default function Pacientes() {
  const { pacientes, crearPaciente } = useAppointments();
  const [query, setQuery] = useState("");
  const [openNuevo, setOpenNuevo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = pacientes;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => patientFullName(p).toLowerCase().includes(q) || (p.telefono || "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
    }
    return [...list].sort((a, b) => patientFullName(a).localeCompare(patientFullName(b)));
  }, [pacientes, query]);

  async function guardarNuevo() {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await crearPaciente({ nombre, telefono, email });
      toast.success("Paciente añadido");
      setOpenNuevo(false);
      setNombre("");
      setTelefono("");
      setEmail("");
    } catch (err) {
      toast.error(err.message || "No se pudo crear el paciente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader
        title="Pacientes"
        subtitle={`${pacientes.length} en total`}
        actions={
          <Button variant="accent" size="sm" onClick={() => setOpenNuevo(true)}>
            <UserPlus size={15} strokeWidth={2.3} className="-ml-0.5" />
            <span className="hidden sm:inline">Nuevo paciente</span>
          </Button>
        }
      />

      <div className="px-4 pb-4 lg:px-8">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o teléfono" />
      </div>

      <div className="px-4 lg:px-8">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin resultados" description="Ningún paciente coincide con la búsqueda." />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {filtered.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={openNuevo} onOpenChange={setOpenNuevo} title="Paciente nuevo">
        <div className="flex flex-col gap-2.5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo"
            autoFocus
            className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (opcional)"
            type="email"
            className="h-11 rounded-xl border border-line px-3.5 text-[14px] focus:border-sage-300"
          />
          <Button variant="accent" block disabled={!nombre.trim() || saving} onClick={guardarNuevo} className="mt-1.5">
            {saving ? "Guardando…" : "Guardar paciente"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
