import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Reservar from "./pages/Reservar.jsx";
import Cancelar from "./pages/Cancelar.jsx";
import Login from "./pages/admin/Login.jsx";
import Panel from "./pages/admin/Panel.jsx";
import Pacientes from "./pages/admin/Pacientes.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservar" element={<Reservar />} />
      <Route path="/cancelar" element={<Cancelar />} />

      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin/panel"
        element={
          <ProtectedRoute>
            <Panel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pacientes"
        element={
          <ProtectedRoute>
            <Pacientes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
