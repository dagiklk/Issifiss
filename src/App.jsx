import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Reservar from "./pages/Reservar.jsx";
import Cancelar from "./pages/Cancelar.jsx";
import Login from "./pages/admin/Login.jsx";
import Panel from "./pages/admin/Panel.jsx";
import Agenda from "./pages/admin/Agenda.jsx";
import Citas from "./pages/admin/Citas.jsx";
import NuevaCita from "./pages/admin/NuevaCita.jsx";
import Pacientes from "./pages/admin/Pacientes.jsx";
import PacienteDetalle from "./pages/admin/PacienteDetalle.jsx";
import Ajustes from "./pages/admin/Ajustes.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminShell from "./components/admin/layout/AdminShell.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservar" element={<Reservar />} />
      <Route path="/cancelar" element={<Cancelar />} />

      <Route path="/admin/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Panel />} />
        <Route path="/admin/agenda" element={<Agenda />} />
        <Route path="/admin/citas" element={<Citas />} />
        <Route path="/admin/citas/nueva" element={<NuevaCita />} />
        <Route path="/admin/pacientes" element={<Pacientes />} />
        <Route path="/admin/pacientes/:id" element={<PacienteDetalle />} />
        <Route path="/admin/ajustes" element={<Ajustes />} />
        {/* Compatibilidad con el enlace anterior del panel */}
        <Route path="/admin/panel" element={<Panel />} />
      </Route>
    </Routes>
  );
}
