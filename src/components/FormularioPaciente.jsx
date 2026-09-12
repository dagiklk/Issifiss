import { useState } from "react";
import Button from "./admin/ui/Button.jsx";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-sage-300 focus:outline-none";

export default function FormularioPaciente({ datos, onChange, onSubmit, enviando, pedirPassword }) {
  const [errores, setErrores] = useState({});

  function validar() {
    const nuevosErrores = {};
    if (!datos.nombre?.trim()) nuevosErrores.nombre = "Introduce tu nombre";
    if (!datos.email?.trim() && !datos.telefono?.trim()) {
      nuevosErrores.contacto = "Indica un email o un teléfono de contacto";
    }
    if (pedirPassword) {
      if (!datos.email?.trim()) nuevosErrores.email = "El email es obligatorio para crear tu cuenta";
      if (!datos.password || datos.password.length < 6) {
        nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
      }
    }
    if (!datos.consentimientoRGPD) {
      nuevosErrores.consentimiento = "Debes aceptar el tratamiento de tus datos para continuar";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validar()) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Nombre completo</label>
        <input
          className={inputClass}
          type="text"
          placeholder="Tu nombre y apellidos"
          value={datos.nombre || ""}
          onChange={(e) => onChange({ ...datos, nombre: e.target.value })}
        />
        {errores.nombre && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.nombre}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Email</label>
          <input
            className={inputClass}
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={datos.email || ""}
            onChange={(e) => onChange({ ...datos, email: e.target.value })}
          />
          {errores.email && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Teléfono</label>
          <input
            className={inputClass}
            type="tel"
            placeholder="600 000 000"
            value={datos.telefono || ""}
            onChange={(e) => onChange({ ...datos, telefono: e.target.value })}
          />
        </div>
      </div>
      {errores.contacto && <p className="text-[12.5px] text-rose-600">{errores.contacto}</p>}

      {pedirPassword && (
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Crea una contraseña</label>
          <input
            className={inputClass}
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={datos.password || ""}
            onChange={(e) => onChange({ ...datos, password: e.target.value })}
          />
          <p className="mt-1.5 text-[12.5px] text-ink-faint">
            Así te creamos una cuenta y no tendrás que rellenar tus datos la próxima vez.
          </p>
          {errores.password && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.password}</p>}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-muted">Motivo de consulta (opcional)</label>
        <textarea
          className={`${inputClass} h-auto resize-none py-2.5`}
          rows={3}
          placeholder="Cuéntanos brevemente qué te ocurre"
          value={datos.notas || ""}
          onChange={(e) => onChange({ ...datos, notas: e.target.value })}
        />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-sage-600"
            checked={datos.consentimientoRGPD || false}
            onChange={(e) => onChange({ ...datos, consentimientoRGPD: e.target.checked })}
          />
          <span className="text-[13px] leading-relaxed text-ink-muted">
            Acepto el tratamiento de mis datos personales y de salud según la{" "}
            <a href="/privacidad" className="font-medium text-sage-700 underline underline-offset-2">
              política de privacidad
            </a>{" "}
            y los{" "}
            <a href="/terminos" className="font-medium text-sage-700 underline underline-offset-2">
              términos y condiciones
            </a>
            .
          </span>
        </label>
        {errores.consentimiento && <p className="mt-1.5 text-[12.5px] text-rose-600">{errores.consentimiento}</p>}
      </div>

      <Button type="submit" variant="accent" block disabled={enviando}>
        {enviando ? "Reservando…" : "Confirmar reserva"}
      </Button>
    </form>
  );
}
