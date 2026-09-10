import { useState } from "react";

export default function FormularioPaciente({ datos, onChange, onSubmit, enviando }) {
  const [errores, setErrores] = useState({});

  function validar() {
    const nuevosErrores = {};
    if (!datos.nombre?.trim()) nuevosErrores.nombre = "Introduce tu nombre";
    if (!datos.email?.trim() && !datos.telefono?.trim()) {
      nuevosErrores.contacto = "Indica un email o un teléfono de contacto";
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
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label-issi">Nombre completo</label>
        <input
          className="form-control-issi"
          type="text"
          placeholder="Tu nombre y apellidos"
          value={datos.nombre || ""}
          onChange={(e) => onChange({ ...datos, nombre: e.target.value })}
        />
        {errores.nombre && <div className="text-error">{errores.nombre}</div>}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label-issi">Email</label>
          <input
            className="form-control-issi"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={datos.email || ""}
            onChange={(e) => onChange({ ...datos, email: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label-issi">Teléfono</label>
          <input
            className="form-control-issi"
            type="tel"
            placeholder="600 000 000"
            value={datos.telefono || ""}
            onChange={(e) => onChange({ ...datos, telefono: e.target.value })}
          />
        </div>
      </div>
      {errores.contacto && <div className="text-error mb-3">{errores.contacto}</div>}

      <div className="mb-3">
        <label className="form-label-issi">Motivo de consulta (opcional)</label>
        <textarea
          className="form-control-issi"
          rows={3}
          placeholder="Cuéntanos brevemente qué te ocurre"
          value={datos.notas || ""}
          onChange={(e) => onChange({ ...datos, notas: e.target.value })}
        />
      </div>

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="consentimiento"
          checked={datos.consentimientoRGPD || false}
          onChange={(e) => onChange({ ...datos, consentimientoRGPD: e.target.checked })}
        />
        <label
          className="form-check-label"
          htmlFor="consentimiento"
          style={{ color: "var(--text-2)", fontSize: "0.85rem" }}
        >
          Acepto el tratamiento de mis datos personales y de salud según la{" "}
          <a href="/privacidad" style={{ color: "var(--accent)" }}>
            política de privacidad
          </a>
          .
        </label>
        {errores.consentimiento && <div className="text-error">{errores.consentimiento}</div>}
      </div>

      <button type="submit" className="btn btn-accent w-100" disabled={enviando}>
        {enviando ? "Reservando..." : "Confirmar reserva"}
      </button>
    </form>
  );
}
