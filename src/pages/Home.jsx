import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ServicioCard from "../components/ServicioCard.jsx";
import ecoDetalle from "../assets/ecografia/eco-detalle.jpg";
import ecoDetalle2 from "../assets/ecografia/eco-detalle-2.jpg";
import ecoConsulta from "../assets/ecografia/eco-consulta.jpg";
import ecoVascular from "../assets/ecografia/eco-vascular.jpg";

export default function Home() {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    async function cargarServicios() {
      const { data } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      setServicios(data ?? []);
    }
    cargarServicios();
  }, []);

  return (
    <>
      <Navbar />

      <div className="container hero">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="badge-soft mb-3">Fisioterapia</span>
            <h1>
              Recupera tu <span className="text-gradient">movimiento</span>, a tu ritmo.
            </h1>
            <p className="lead mt-3">
              Sesiones personalizadas de fisioterapia deportiva y rehabilitación. Reserva tu cita
              online en menos de un minuto.
            </p>
            <div className="d-flex gap-3 mt-4">
              <Link to="/reservar" className="btn btn-accent">
                Reservar cita
              </Link>
              <a href="#servicios" className="btn btn-outline-issi">
                Ver servicios
              </a>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-media-wrap">
              <img className="hero-media" src={ecoDetalle} alt="Fisioterapeuta realizando una ecografía diagnóstica en consulta" />
              <div className="hero-float-badge">
                <div className="icono flex-shrink-0">
                  <i className="bi bi-soundwave"></i>
                </div>
                <div>
                  <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                    Ecógrafo en consulta
                  </div>
                  <div style={{ color: "var(--text-3)", fontSize: "0.78rem" }}>
                    Diagnóstico por imagen incluido
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4" id="servicios">
        <div className="section-title">Nuestros servicios</div>
        <div className="row g-4">
          {servicios.map((servicio) => (
            <div className="col-md-4" key={servicio.id}>
              <Link to="/reservar" style={{ textDecoration: "none" }}>
                <ServicioCard servicio={servicio} />
              </Link>
            </div>
          ))}
          {servicios.length === 0 && (
            <p style={{ color: "var(--text-2)" }}>
              Todavía no hay servicios configurados. Añádelos en la tabla "servicios" de Supabase.
            </p>
          )}
        </div>
      </div>

      <div className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 order-lg-2">
            <span className="badge-soft mb-3">Diagnóstico por imagen</span>
            <div className="section-title mb-3">Ecografía musculoesquelética en la misma consulta</div>
            <p style={{ color: "var(--text-2)" }}>
              Localizamos la lesión en tiempo real, te enseñamos la imagen en pantalla y ajustamos
              el tratamiento en el momento, sin desplazamientos ni listas de espera de radiología.
            </p>
            <ul className="list-unstyled d-flex flex-column gap-3 mt-4">
              <li className="d-flex align-items-start gap-3">
                <div className="icono flex-shrink-0">
                  <i className="bi bi-search"></i>
                </div>
                <div>
                  <div className="fw-semibold">Localización precisa</div>
                  <div style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
                    Tendones, músculo y tejidos blandos, en directo.
                  </div>
                </div>
              </li>
              <li className="d-flex align-items-start gap-3">
                <div className="icono flex-shrink-0">
                  <i className="bi bi-easel2"></i>
                </div>
                <div>
                  <div className="fw-semibold">Te mostramos el hallazgo</div>
                  <div style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
                    Vemos la imagen juntos y te explicamos qué significa.
                  </div>
                </div>
              </li>
              <li className="d-flex align-items-start gap-3">
                <div className="icono flex-shrink-0">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div>
                  <div className="fw-semibold">Resultado inmediato</div>
                  <div style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
                    Integrado en la misma sesión de fisioterapia.
                  </div>
                </div>
              </li>
            </ul>
            <Link to="/reservar" className="btn btn-accent mt-4">
              Reservar valoración con ecografía
            </Link>
          </div>
          <div className="col-lg-6 order-lg-1">
            <div className="bento-grid">
              <img className="bento-tall" src={ecoConsulta} alt="Fisioterapeuta explicando una imagen de ecografía al paciente" />
              <img className="bento-square" src={ecoVascular} alt="Estudio ecográfico en consulta con doble monitor" />
              <img className="bento-square" src={ecoDetalle2} alt="Detalle de exploración con ecógrafo portátil" />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
