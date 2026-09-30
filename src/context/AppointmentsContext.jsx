import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient.js";
import {
  diaSemanaFromISO,
  minutosDesde,
  seSolapaConOcupadas,
  slotsForDia,
  toUiCita,
  toUiPaciente,
  toUiServicio,
} from "../lib/clinicData.js";
import { zonedTimeToUtc } from "../utils/dateHelpers.js";

// Real data provider for the admin UI — everything here reads from and
// writes to the live Supabase project (citas, pacientes, servicios,
// disponibilidad), with a realtime subscription so every open tab/device
// stays in sync. No mock or local-only appointment data lives here.
const AppointmentsContext = createContext(null);

// Columnas explícitas en vez de "*": "token_confirmacion" (ver
// schema_ocultar_token_confirmacion.sql) no debe pedirse desde el cliente
// aunque el admin sí tenga permiso de fila — el panel nunca lo usa, y una
// vez aplicada esa migración un "*" fallaría igualmente al no tener acceso
// de columna a él.
const CITA_SELECT =
  "id, paciente_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado, token_cancelacion, notas, creado_en, precio, pacientes(*), servicios(*)";
const NOTIFICAR_CONFIRMACION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notificar-confirmacion`;

export function AppointmentsProvider({ children }) {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Antes, un fallo aquí (token caducado a medias, el admin fuera de la
  // whitelist "admins", corte de red) dejaba citas/pacientes/servicios en []
  // sin ningún aviso — el panel se veía "vacío" como si la clínica no tuviera
  // nada, indistinguible de la realidad. Con esto al menos se avisa.
  useEffect(() => {
    if (error) toast.error("No se pudieron cargar los datos del panel. Comprueba tu conexión y recarga la página.");
  }, [error]);

  const refreshCitas = useCallback(async () => {
    const { data, error } = await supabase.from("citas").select(CITA_SELECT).order("fecha_hora_inicio");
    if (error) {
      setError(error);
      return;
    }
    setCitas((data || []).map(toUiCita));
  }, []);

  const refreshPacientes = useCallback(async () => {
    const { data, error } = await supabase.from("pacientes").select("*").order("nombre");
    if (error) {
      setError(error);
      return;
    }
    setPacientes((data || []).map(toUiPaciente));
  }, []);

  const refreshDisponibilidad = useCallback(async () => {
    const { data, error } = await supabase.from("disponibilidad").select("*").eq("activo", true).order("dia_semana");
    if (error) {
      setError(error);
      return;
    }
    setDisponibilidad(data || []);
  }, []);

  const refreshServicios = useCallback(async () => {
    const { data, error } = await supabase.from("servicios").select("*").eq("activo", true).order("nombre");
    if (error) {
      setError(error);
      return;
    }
    setServicios((data || []).map(toUiServicio));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAll() {
      setLoading(true);
      const [citasRes, pacientesRes, serviciosRes, dispoRes] = await Promise.all([
        supabase.from("citas").select(CITA_SELECT).order("fecha_hora_inicio"),
        supabase.from("pacientes").select("*").order("nombre"),
        supabase.from("servicios").select("*").eq("activo", true).order("nombre"),
        supabase.from("disponibilidad").select("*").eq("activo", true).order("dia_semana"),
      ]);
      if (!active) return;

      const firstError = citasRes.error || pacientesRes.error || serviciosRes.error || dispoRes.error;
      if (firstError) setError(firstError);

      setCitas((citasRes.data || []).map(toUiCita));
      setPacientes((pacientesRes.data || []).map(toUiPaciente));
      setServicios((serviciosRes.data || []).map(toUiServicio));
      setDisponibilidad(dispoRes.data || []);
      setLoading(false);
    }
    loadAll();

    const channel = supabase
      .channel("admin-citas-pacientes")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, () => refreshCitas())
      .on("postgres_changes", { event: "*", schema: "public", table: "pacientes" }, () => refreshPacientes())
      .on("postgres_changes", { event: "*", schema: "public", table: "disponibilidad" }, () => refreshDisponibilidad())
      .on("postgres_changes", { event: "*", schema: "public", table: "servicios" }, () => refreshServicios())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [refreshCitas, refreshPacientes, refreshDisponibilidad, refreshServicios]);

  const crearPaciente = useCallback(async ({ nombre, telefono, email }) => {
    const { data, error } = await supabase
      .from("pacientes")
      .insert({
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        // A diferencia de FormularioPaciente.jsx (reserva pública), el panel
        // no muestra ningún checkbox de consentimiento al dar de alta un
        // paciente a mano — así que no se puede afirmar que lo haya dado.
        // Antes esto se guardaba como `true` con la fecha de ahora, dejando
        // un registro legal de consentimiento de datos de salud que nunca
        // se produjo realmente.
        consentimiento_rgpd: false,
        consentimiento_fecha: null,
      })
      .select()
      .single();
    if (error) throw error;
    const paciente = toUiPaciente(data);
    setPacientes((prev) => [...prev, paciente].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return paciente;
  }, []);

  const actualizarNotasPaciente = useCallback(
    async (pacienteId, notas) => {
      setPacientes((prev) => prev.map((p) => (p.id === pacienteId ? { ...p, notasGenerales: notas } : p)));
      const { error } = await supabase.from("pacientes").update({ notas_generales: notas || null }).eq("id", pacienteId);
      if (error) {
        await refreshPacientes();
        throw error;
      }
    },
    [refreshPacientes]
  );

  const updateStatus = useCallback(
    async (citaId, estado) => {
      setCitas((prev) => prev.map((c) => (c.id === citaId ? { ...c, estado } : c)));
      const { error } = await supabase.from("citas").update({ estado }).eq("id", citaId);
      if (error) {
        await refreshCitas();
        throw error;
      }

      // Al confirmar una cita desde el panel, avisamos al paciente por email.
      // No bloqueamos ni fallamos la actualización de estado si esto falla.
      if (estado === "confirmada") {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (accessToken) {
          fetch(NOTIFICAR_CONFIRMACION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ cita_id: citaId }),
          }).catch((err) => console.error("No se pudo enviar el email de confirmación:", err));
        }
      }
    },
    [refreshCitas]
  );

  const updateNotas = useCallback(
    async (citaId, notas) => {
      setCitas((prev) => prev.map((c) => (c.id === citaId ? { ...c, notas } : c)));
      const { error } = await supabase.from("citas").update({ notas: notas || null }).eq("id", citaId);
      if (error) {
        await refreshCitas();
        throw error;
      }
    },
    [refreshCitas]
  );

  const guardarFranjasDia = useCallback(
    async (diaSemana, franjas) => {
      // RPC atómica (ver supabase/schema_franjas_atomico.sql): borrar y
      // volver a insertar como dos llamadas sueltas dejaba el día sin
      // ninguna franja si la segunda fallaba justo después de que la
      // primera tuviera éxito (red, validación...), sin que nadie se
      // enterara hasta que un paciente no pudiera reservar ese día.
      const { error } = await supabase.rpc("reemplazar_franjas_dia", {
        p_dia_semana: diaSemana,
        p_franjas: franjas.map((f) => ({ horaInicio: f.horaInicio, horaFin: f.horaFin })),
      });
      if (error) throw error;

      await refreshDisponibilidad();
    },
    [refreshDisponibilidad]
  );

  const crearCita = useCallback(
    async ({ pacienteId, nuevoPaciente, servicioId, fecha, horaInicio, notas }) => {
      let finalPacienteId = pacienteId;
      if (!finalPacienteId && nuevoPaciente?.nombre) {
        const paciente = await crearPaciente(nuevoPaciente);
        finalPacienteId = paciente.id;
      }

      const servicio = servicios.find((s) => s.id === servicioId);
      if (!servicio) throw new Error("Selecciona un tratamiento válido.");

      const inicio = zonedTimeToUtc(fecha, horaInicio);
      const fin = new Date(inicio.getTime() + servicio.duracionMin * 60000);

      const { data, error } = await supabase
        .from("citas")
        .insert({
          paciente_id: finalPacienteId,
          servicio_id: servicioId,
          fecha_hora_inicio: inicio.toISOString(),
          fecha_hora_fin: fin.toISOString(),
          estado: "confirmada",
          precio: servicio.precio,
          notas: notas || null,
        })
        .select(CITA_SELECT)
        .single();

      if (error) {
        if (error.code === "23P01") throw new Error("Ese horario ya no está disponible.");
        throw error;
      }
      const cita = toUiCita(data);
      setCitas((prev) => [...prev, cita].sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)));
      return cita;
    },
    [servicios, crearPaciente]
  );

  const reprogramarCita = useCallback(
    async (citaId, { fecha, horaInicio }) => {
      const cita = citas.find((c) => c.id === citaId);
      if (!cita) throw new Error("La cita no existe.");
      const servicio = servicios.find((s) => s.id === cita.servicioId) || cita.tratamiento;
      const duracionMin = servicio?.duracionMin || 30;

      const inicio = zonedTimeToUtc(fecha, horaInicio);
      const fin = new Date(inicio.getTime() + duracionMin * 60000);
      // Reprogramar desde el panel es una decisión del fisio: se mantiene el
      // estado actual (si estaba confirmada, sigue confirmada) a diferencia
      // de reprogramar-cita (el cliente sí vuelve a pendiente de confirmar).
      const { data, error } = await supabase
        .from("citas")
        .update({ fecha_hora_inicio: inicio.toISOString(), fecha_hora_fin: fin.toISOString() })
        .eq("id", citaId)
        .select(CITA_SELECT)
        .single();

      if (error) {
        if (error.code === "23P01") throw new Error("Ese horario ya no está disponible.");
        throw error;
      }
      const actualizada = toUiCita(data);
      setCitas((prev) =>
        prev
          .map((c) => (c.id === citaId ? actualizada : c))
          .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))
      );
      return actualizada;
    },
    [citas, servicios]
  );

  function getByFecha(fechaISO) {
    return citas.filter((c) => c.fecha === fechaISO);
  }
  function getByPaciente(pacienteId) {
    return citas
      .filter((c) => c.pacienteId === pacienteId)
      .sort((a, b) => (b.fecha + b.horaInicio).localeCompare(a.fecha + a.horaInicio));
  }
  function getProxima(pacienteId, fromISO = format(new Date(), "yyyy-MM-dd")) {
    return getByPaciente(pacienteId)
      .filter((c) => c.fecha >= fromISO && !["cancelada", "completada", "no_asistio"].includes(c.estado))
      .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))[0];
  }
  function getUltima(pacienteId, beforeISO = format(new Date(), "yyyy-MM-dd")) {
    return getByPaciente(pacienteId).find((c) => c.fecha <= beforeISO && c.estado === "completada");
  }
  // Devuelve los intervalos [inicio, fin) (en minutos desde medianoche) de
  // las citas activas ese día, no un Set de horas de inicio — así un hueco
  // candidato de otra duración puede comprobar si CAE DENTRO de una cita ya
  // reservada, no solo si coincide exactamente con su hora de inicio (ver
  // seSolapaConOcupadas en lib/clinicData.js).
  function horasOcupadas(fechaISO, excludeCitaId = null) {
    return getByFecha(fechaISO)
      .filter((c) => c.estado !== "cancelada" && c.id !== excludeCitaId)
      .map((c) => ({ inicio: minutosDesde(c.horaInicio), fin: minutosDesde(c.horaFin) }));
  }
  function slotsForDate(fechaISO, duracionMin = 30) {
    return slotsForDia(disponibilidad, diaSemanaFromISO(fechaISO), duracionMin);
  }
  function horasLibres(fechaISO, duracionMin = 30, excludeCitaId = null) {
    const ocupadas = horasOcupadas(fechaISO, excludeCitaId);
    return slotsForDate(fechaISO, duracionMin).filter((h) => !seSolapaConOcupadas(ocupadas, h, duracionMin));
  }

  const value = useMemo(
    () => ({
      citas,
      pacientes,
      servicios,
      disponibilidad,
      loading,
      error,
      updateStatus,
      updateNotas,
      crearCita,
      reprogramarCita,
      crearPaciente,
      actualizarNotasPaciente,
      guardarFranjasDia,
      getByFecha,
      getByPaciente,
      getProxima,
      getUltima,
      horasOcupadas,
      slotsForDate,
      horasLibres,
      refresh: refreshCitas,
    }),
    [
      citas,
      pacientes,
      servicios,
      disponibilidad,
      loading,
      error,
      updateStatus,
      updateNotas,
      crearCita,
      reprogramarCita,
      crearPaciente,
      actualizarNotasPaciente,
      guardarFranjasDia,
      refreshCitas,
    ]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments debe usarse dentro de <AppointmentsProvider>");
  return ctx;
}
