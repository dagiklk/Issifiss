import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import Switch from "../ui/Switch.jsx";
import Button from "../ui/Button.jsx";
import Sheet from "../ui/Sheet.jsx";
import { supabase } from "../../../lib/supabaseClient.js";

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-white px-2.5 text-[13.5px] text-ink focus:border-sage-300 focus:outline-none";

function servicioVacio() {
  return { id: null, nombre: "", duracion_minutos: 30, precio: "", descripcion: "", activo: true };
}

export default function ServiciosEditor() {
  const [servicios, setServicios] = useState(null);
  const [nuevos, setNuevos] = useState([]);
  const [guardando, setGuardando] = useState(null);
  // Confirmación de borrado como bottom sheet propio de la app, en vez del
  // window.confirm() del navegador (rompía la sensación de app nativa).
  const [servicioAEliminar, setServicioAEliminar] = useState(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("servicios")
      .select("*")
      .order("nombre")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("No se pudieron cargar los servicios");
          setServicios([]);
          return;
        }
        setServicios(data || []);
      });
    return () => {
      active = false;
    };
  }, []);

  function actualizarCampo(id, campo, valor) {
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)));
  }

  function actualizarNuevo(indice, campo, valor) {
    setNuevos((prev) => prev.map((s, i) => (i === indice ? { ...s, [campo]: valor } : s)));
  }

  function validar(servicio) {
    if (!servicio.nombre?.trim()) return "Ponle un nombre al servicio";
    if (!servicio.duracion_minutos || servicio.duracion_minutos <= 0) return "La duración debe ser mayor que 0";
    if (servicio.precio !== "" && servicio.precio !== null && Number(servicio.precio) < 0) return "El precio no puede ser negativo";
    return null;
  }

  async function guardarExistente(servicio) {
    const error = validar(servicio);
    if (error) {
      toast.error(error);
      return;
    }
    setGuardando(servicio.id);
    try {
      const { error: dbError } = await supabase
        .from("servicios")
        .update({
          nombre: servicio.nombre.trim(),
          duracion_minutos: Number(servicio.duracion_minutos),
          precio: servicio.precio === "" ? null : Number(servicio.precio),
          descripcion: servicio.descripcion?.trim() || null,
          activo: servicio.activo,
        })
        .eq("id", servicio.id);
      if (dbError) throw dbError;
      toast.success("Servicio actualizado");
    } catch (err) {
      toast.error(err.message || "No se pudo guardar el servicio");
    } finally {
      setGuardando(null);
    }
  }

  async function confirmarEliminacion() {
    const servicio = servicioAEliminar;
    if (!servicio) return;
    setServicioAEliminar(null);

    setGuardando(servicio.id);
    try {
      const { error: dbError } = await supabase.from("servicios").delete().eq("id", servicio.id);
      if (dbError) {
        if (dbError.code === "23503") {
          toast.error("No se puede eliminar: ya tiene citas asociadas. Desactívalo en su lugar.");
          return;
        }
        throw dbError;
      }
      setServicios((prev) => prev.filter((s) => s.id !== servicio.id));
      toast.success("Servicio eliminado");
    } catch (err) {
      toast.error(err.message || "No se pudo eliminar el servicio");
    } finally {
      setGuardando(null);
    }
  }

  async function crearNuevo(indice) {
    const servicio = nuevos[indice];
    const error = validar(servicio);
    if (error) {
      toast.error(error);
      return;
    }
    setGuardando(`nuevo-${indice}`);
    try {
      const { data, error: dbError } = await supabase
        .from("servicios")
        .insert({
          nombre: servicio.nombre.trim(),
          duracion_minutos: Number(servicio.duracion_minutos),
          precio: servicio.precio === "" ? null : Number(servicio.precio),
          descripcion: servicio.descripcion?.trim() || null,
          activo: servicio.activo,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      setServicios((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevos((prev) => prev.filter((_, i) => i !== indice));
      toast.success("Servicio creado");
    } catch (err) {
      toast.error(err.message || "No se pudo crear el servicio");
    } finally {
      setGuardando(null);
    }
  }

  if (servicios === null) {
    return (
      <Card className="p-4">
        <p className="text-[13.5px] text-ink-faint">Cargando servicios…</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {servicios.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <input
              className={`${inputClass} font-medium`}
              value={s.nombre}
              onChange={(e) => actualizarCampo(s.id, "nombre", e.target.value)}
              placeholder="Nombre del servicio"
            />
            <Switch checked={s.activo} onChange={(v) => actualizarCampo(s.id, "activo", v)} label={`Activo ${s.nombre}`} />
            <button
              type="button"
              onClick={() => setServicioAEliminar(s)}
              disabled={guardando === s.id}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
              aria-label={`Eliminar ${s.nombre}`}
            >
              <Trash2 size={15} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-[11.5px] text-ink-faint">Duración (min)</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={s.duracion_minutos}
                onChange={(e) => actualizarCampo(s.id, "duracion_minutos", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-ink-faint">Precio (€)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={s.precio ?? ""}
                onChange={(e) => actualizarCampo(s.id, "precio", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2.5">
            <label className="mb-1 block text-[11.5px] text-ink-faint">Descripción</label>
            <textarea
              className={`${inputClass} h-auto resize-none py-2`}
              rows={2}
              value={s.descripcion || ""}
              onChange={(e) => actualizarCampo(s.id, "descripcion", e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => guardarExistente(s)} disabled={guardando === s.id} className="mt-3">
            {guardando === s.id ? "Guardando…" : "Guardar"}
          </Button>
        </Card>
      ))}

      {nuevos.map((s, i) => (
        <Card key={`nuevo-${i}`} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <input
              className={`${inputClass} font-medium`}
              value={s.nombre}
              onChange={(e) => actualizarNuevo(i, "nombre", e.target.value)}
              placeholder="Nombre del servicio"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setNuevos((prev) => prev.filter((_, idx) => idx !== i))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-canvas-sunken hover:text-rose-600"
              aria-label="Descartar"
            >
              <Trash2 size={15} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-[11.5px] text-ink-faint">Duración (min)</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={s.duracion_minutos}
                onChange={(e) => actualizarNuevo(i, "duracion_minutos", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-ink-faint">Precio (€)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={s.precio}
                onChange={(e) => actualizarNuevo(i, "precio", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2.5">
            <label className="mb-1 block text-[11.5px] text-ink-faint">Descripción</label>
            <textarea
              className={`${inputClass} h-auto resize-none py-2`}
              rows={2}
              value={s.descripcion}
              onChange={(e) => actualizarNuevo(i, "descripcion", e.target.value)}
            />
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => crearNuevo(i)}
            disabled={guardando === `nuevo-${i}`}
            className="mt-3"
          >
            {guardando === `nuevo-${i}` ? "Creando…" : "Crear servicio"}
          </Button>
        </Card>
      ))}

      <button
        type="button"
        onClick={() => setNuevos((prev) => [...prev, servicioVacio()])}
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong py-3 text-[13px] font-medium text-sage-700 transition-colors hover:bg-sage-50/50"
      >
        <Plus size={15} strokeWidth={2} /> Añadir servicio
      </button>

      <Sheet
        open={!!servicioAEliminar}
        onOpenChange={(v) => !v && setServicioAEliminar(null)}
        title="Eliminar servicio"
        description={servicioAEliminar ? `«${servicioAEliminar.nombre}» se eliminará permanentemente.` : ""}
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" block onClick={() => setServicioAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="danger" block onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </div>
        }
      >
        <p className="text-[13.5px] text-ink-muted">Esta acción no se puede deshacer.</p>
      </Sheet>
    </div>
  );
}
