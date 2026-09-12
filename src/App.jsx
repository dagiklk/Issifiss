import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Reservar from "./pages/Reservar.jsx";
import Cancelar from "./pages/Cancelar.jsx";
import AvisoLegal from "./pages/legal/AvisoLegal.jsx";
import Privacidad from "./pages/legal/Privacidad.jsx";
import Terminos from "./pages/legal/Terminos.jsx";
import Login from "./pages/admin/Login.jsx";
import Panel from "./pages/admin/Panel.jsx";
import Agenda from "./pages/admin/Agenda.jsx";
import Citas from "./pages/admin/Citas.jsx";
import NuevaCita from "./pages/admin/NuevaCita.jsx";
import Pacientes from "./pages/admin/Pacientes.jsx";
import PacienteDetalle from "./pages/admin/PacienteDetalle.jsx";
import Ajustes from "./pages/admin/Ajustes.jsx";
import Ingresos from "./pages/admin/Ingresos.jsx";
import ClienteLogin from "./pages/cliente/Login.jsx";
import ClienteRegistro from "./pages/cliente/Registro.jsx";
import MiCuenta from "./pages/cliente/MiCuenta.jsx";
import RecuperarPassword from "./pages/cliente/RecuperarPassword.jsx";
import RestablecerPassword from "./pages/cliente/RestablecerPassword.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import ClientProtectedRoute from "./routes/ClientProtectedRoute.jsx";
import AdminShell from "./components/admin/layout/AdminShell.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservar" element={<Reservar />} />
      <Route path="/cancelar" element={<Cancelar />} />
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />

      <Route path="/cuenta/login" element={<ClienteLogin />} />
      <Route path="/cuenta/registro" element={<ClienteRegistro />} />
      <Route path="/cuenta/recuperar" element={<RecuperarPassword />} />
      <Route path="/cuenta/restablecer" element={<RestablecerPassword />} />
      <Route
        path="/cuenta"
        element={
          <ClientProtectedRoute>
            <MiCuenta />
          </ClientProtectedRoute>
        }
      />

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
        <Route path="/admin/ingresos" element={<Ingresos />} />
        {/* Compatibilidad con el enlace anterior del panel */}
        <Route path="/admin/panel" element={<Panel />} />
      </Route>
    </Routes>
  );
}
