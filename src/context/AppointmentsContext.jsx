import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient.js";
import { diaSemanaFromISO, slotsForDia, toUiCita, toUiPaciente, toUiServicio } from "../lib/clinicData.js";

// Real data provider for the admin UI — everything here reads from and
// writes to the live Supabase project (citas, pacientes, servicios,
// disponibilidad), with a realtime subscription so every open tab/device
// stays in sync. No mock or local-only appointment data lives here.
const AppointmentsContext = createContext(null);

const CITA_SELECT = "*, pacientes(*), servicios(*)";

export function AppointmentsProvider({ children }) {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [refreshCitas, refreshPacientes, refreshDisponibilidad]);

  const crearPaciente = useCallback(async ({ nombre, telefono, email }) => {
    const { data, error } = await supabase
      .from("pacientes")
      .insert({
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        consentimiento_rgpd: true,
        consentimiento_fecha: new Date().toISOString(),
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
      const { error: deleteError } = await supabase.from("disponibilidad").delete().eq("dia_semana", diaSemana);
      if (deleteError) throw deleteError;

      if (franjas.length > 0) {
        const { error: insertError } = await supabase.from("disponibilidad").insert(
          franjas.map((f) => ({
            dia_semana: diaSemana,
            hora_inicio: f.horaInicio,
            hora_fin: f.horaFin,
            activo: true,
          }))
        );
        if (insertError) throw insertError;
      }

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

      const [h, m] = horaInicio.split(":").map(Number);
      const inicio = new Date(`${fecha}T00:00:00`);
      inicio.setHours(h, m, 0, 0);
      const fin = new Date(inicio.getTime() + servicio.duracionMin * 60000);

      const { data, error } = await supabase
        .from("citas")
        .insert({
          paciente_id: finalPacienteId,
          servicio_id: servicioId,
          fecha_hora_inicio: inicio.toISOString(),
          fecha_hora_fin: fin.toISOString(),
          estado: "confirmada",
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
      .filter((c) => c.fecha >= fromISO && c.estado !== "cancelada")
      .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))[0];
  }
  function getUltima(pacienteId, beforeISO = format(new Date(), "yyyy-MM-dd")) {
    return getByPaciente(pacienteId).find((c) => c.fecha <= beforeISO && c.estado === "completada");
  }
  function horasOcupadas(fechaISO) {
    return new Set(getByFecha(fechaISO).filter((c) => c.estado !== "cancelada").map((c) => c.horaInicio));
  }
  function slotsForDate(fechaISO, duracionMin = 30) {
    return slotsForDia(disponibilidad, diaSemanaFromISO(fechaISO), duracionMin);
  }
  function horasLibres(fechaISO, duracionMin = 30) {
    const ocupadas = horasOcupadas(fechaISO);
    return slotsForDate(fechaISO, duracionMin).filter((h) => !ocupadas.has(h));
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
