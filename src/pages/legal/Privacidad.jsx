import LegalLayout, { Seccion, Placeholder } from "../../components/legal/LegalLayout.jsx";

export default function Privacidad() {
  return (
    <LegalLayout titulo="Política de privacidad">
      <Seccion titulo="1. Responsable del tratamiento">
        <ul className="flex flex-col gap-1.5">
          <li>
            <strong>Responsable:</strong> <Placeholder>Nombre completo o razón social</Placeholder>
          </li>
          <li>
            <strong>NIF/CIF:</strong> <Placeholder>NIF/CIF</Placeholder>
          </li>
          <li>
            <strong>Domicilio:</strong> <Placeholder>Dirección completa</Placeholder>
          </li>
          <li>
            <strong>Email de contacto:</strong> <Placeholder>email@issifiss.com</Placeholder>
          </li>
        </ul>
        <p>
          Puedes dirigirte a esta dirección para cualquier cuestión relacionada con el tratamiento de tus
          datos personales, incluido el ejercicio de tus derechos.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué datos tratamos">
        <p>Según cómo interactúes con el sitio web, tratamos las siguientes categorías de datos:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong>Datos identificativos y de contacto:</strong> nombre, email y teléfono, facilitados al
            reservar una cita o crear una cuenta de cliente.
          </li>
          <li>
            <strong>Datos de salud (categoría especial de datos):</strong> motivo de consulta y, tras la
            visita, las notas clínicas y el historial de tratamiento que tu fisioterapeuta registre en tu
            ficha.
          </li>
          <li>
            <strong>Datos de cuenta:</strong> email y contraseña (almacenada de forma cifrada, nunca en
            texto plano), si decides crear una cuenta de cliente.
          </li>
          <li>
            <strong>Datos de la cita:</strong> servicio solicitado, fecha, hora y estado de la cita
            (pendiente, confirmada, cancelada, completada o no presentado).
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="3. Con qué finalidad tratamos tus datos">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Gestionar la solicitud, confirmación, modificación y cancelación de tus citas.</li>
          <li>Elaborar y mantener tu historial clínico como paciente de fisioterapia.</li>
          <li>Enviarte comunicaciones relacionadas con tu cita (confirmación, recordatorios, avisos de cancelación).</li>
          <li>Gestionar tu cuenta de cliente, si decides crear una.</li>
          <li>Cumplir con las obligaciones legales aplicables a la documentación sanitaria.</li>
        </ul>
        <p>No utilizamos tus datos con fines de marketing ni los cedemos a terceros para publicidad.</p>
      </Seccion>

      <Seccion titulo="4. Base legal del tratamiento">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong>Consentimiento explícito</strong> (art. 9.2.a RGPD), que prestas de forma expresa al
            marcar la casilla de consentimiento antes de confirmar cada reserva, para el tratamiento de tus
            datos de salud.
          </li>
          <li>
            <strong>Ejecución de una relación contractual o precontractual</strong> (art. 6.1.b RGPD), para
            la gestión de tu cita y, en su caso, de tu cuenta de cliente.
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong> (art. 6.1.c RGPD), en lo relativo a la
            normativa de documentación clínica.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="5. Cuánto tiempo conservamos tus datos">
        <p>
          Los datos de cita y de contacto se conservan mientras mantengas una relación activa con la
          clínica. Los datos y la documentación clínica se conservan, como mínimo, durante el plazo legal
          de conservación de la documentación sanitaria (con carácter general, 5 años desde la última
          asistencia, conforme a la Ley 41/2002 básica reguladora de la autonomía del paciente, sin
          perjuicio de plazos superiores que pueda fijar la normativa autonómica aplicable), y en todo caso
          durante el tiempo necesario para atender posibles responsabilidades legales.
        </p>
        <p>
          Si solicitas la eliminación de tu cuenta, tus datos identificativos y de contacto se suprimen o
          anonimizan, salvo aquella información que debamos conservar por obligación legal.
        </p>
      </Seccion>

      <Seccion titulo="6. Destinatarios y encargados del tratamiento">
        <p>
          Tus datos no se ceden a terceros salvo obligación legal. Para poder prestar el servicio,
          recurrimos a los siguientes encargados del tratamiento, que acceden a los datos estrictamente
          necesarios para prestarnos sus servicios y están sujetos a un contrato de encargo conforme al
          art. 28 RGPD:
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong>Supabase</strong> (base de datos, autenticación y alojamiento de la aplicación).
          </li>
          <li>
            <strong>Resend</strong> (envío de emails transaccionales: confirmaciones, avisos y
            recuperación de contraseña).
          </li>
          <li>
            <strong>Vercel</strong> (alojamiento del sitio web).
          </li>
          <li>
            <strong>Google Fonts</strong> (carga de tipografías del sitio web; puede implicar una conexión
            técnica con servidores de Google).
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="7. Transferencias internacionales">
        <p>
          Algunos de los proveedores anteriores pueden alojar datos o disponer de infraestructura fuera del
          Espacio Económico Europeo. En esos casos, la transferencia se ampara en las garantías previstas
          por el RGPD (como las cláusulas contractuales tipo aprobadas por la Comisión Europea) que dichos
          proveedores tienen implementadas.
        </p>
      </Seccion>

      <Seccion titulo="8. Tus derechos">
        <p>
          Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición,
          limitación del tratamiento y portabilidad de tus datos, escribiendo a{" "}
          <Placeholder>email@issifiss.com</Placeholder> e indicando el derecho que deseas ejercer junto con
          una copia de tu documento de identidad. También puedes retirar tu consentimiento en cualquier
          momento, sin que ello afecte a la licitud del tratamiento previo.
        </p>
        <p>
          Si consideras que el tratamiento de tus datos no se ajusta a la normativa vigente, tienes derecho
          a presentar una reclamación ante la Agencia Española de Protección de Datos (
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sage-700 underline underline-offset-2"
          >
            www.aepd.es
          </a>
          ).
        </p>
      </Seccion>

      <Seccion titulo="9. Menores de edad">
        <p>
          Los servicios de reserva online están dirigidos a personas mayores de edad. Si la cita es para un
          menor de edad, debe solicitarla su padre, madre o tutor legal, quien actúa como responsable de la
          reserva y presta el consentimiento en nombre del menor.
        </p>
      </Seccion>

      <Seccion titulo="10. Seguridad de los datos">
        <p>
          Aplicamos las medidas técnicas y organizativas razonables para proteger tus datos frente a
          accesos no autorizados, pérdida o alteración: contraseñas cifradas, control de acceso restringido
          a los datos clínicos (solo accesibles por el fisioterapeuta) y comunicaciones cifradas mediante
          HTTPS.
        </p>
      </Seccion>

      <Seccion titulo="11. Cookies y almacenamiento local">
        <p>
          El sitio web no utiliza cookies de analítica ni de publicidad de terceros. Únicamente emplea
          almacenamiento técnico esencial en tu navegador (necesario para mantener tu sesión iniciada si
          creas una cuenta de cliente), exento del deber de solicitar consentimiento conforme al artículo
          22.2 de la LSSI-CE por ser estrictamente necesario para la prestación del servicio solicitado.
        </p>
      </Seccion>

      <Seccion titulo="12. Cambios en esta política">
        <p>
          Podemos actualizar esta política de privacidad para adaptarla a novedades legislativas o
          cambios en el funcionamiento del sitio web. Te recomendamos revisarla periódicamente; la fecha de
          la última actualización figura al inicio de esta página.
        </p>
      </Seccion>
    </LegalLayout>
  );
}
