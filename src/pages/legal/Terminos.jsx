import LegalLayout, { Seccion, Placeholder } from "../../components/legal/LegalLayout.jsx";

export default function Terminos() {
  return (
    <LegalLayout titulo="Términos y condiciones">
      <Seccion titulo="1. Objeto">
        <p>
          Estos términos y condiciones regulan el uso del servicio de reserva de citas online ofrecido a
          través del sitio web issifiss, propiedad de <Placeholder>Nombre completo o razón social</Placeholder>
          , así como, en su caso, la creación y el uso de una cuenta de cliente. Al solicitar una cita o
          crear una cuenta, aceptas estos términos en su totalidad.
        </p>
      </Seccion>

      <Seccion titulo="2. Proceso de reserva">
        <p>
          Toda solicitud de cita realizada a través del sitio web queda en estado "pendiente" hasta que el
          fisioterapeuta la revise y confirme. Recibirás un email cuando tu solicitud sea registrada y otro
          cuando quede confirmada. La confirmación puede depender de la disponibilidad real de la agenda en
          el momento de la revisión.
        </p>
      </Seccion>

      <Seccion titulo="3. Cambios y cancelaciones">
        <p>
          Puedes cancelar tu cita en cualquier momento a través del enlace de cancelación que recibes por
          email, o desde tu cuenta de cliente si dispones de una. Te pedimos que canceles con la mayor
          antelación posible para poder ofrecer ese horario a otro paciente.
        </p>
        <p>
          Si no acudes a una cita confirmada sin haberla cancelado previamente, tu fisioterapeuta podrá
          registrarla como "no presentada". La acumulación de citas no presentadas sin previo aviso podrá
          suponer restricciones para reservar nuevas citas online.
        </p>
      </Seccion>

      <Seccion titulo="4. Precios y pago">
        <p>
          Los precios de cada servicio se muestran en el sitio web en el momento de la reserva y pueden
          actualizarse periódicamente; el precio aplicable a tu cita es el vigente en el momento en que la
          confirmas. Salvo que se indique expresamente lo contrario, el pago de los servicios se realiza
          directamente en consulta; el sitio web no procesa pagos online.
        </p>
      </Seccion>

      <Seccion titulo="5. Cuenta de cliente">
        <p>
          Si decides crear una cuenta, te comprometes a facilitar datos veraces y a mantener la
          confidencialidad de tu contraseña. Eres responsable de la actividad realizada desde tu cuenta.
          Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo a{" "}
          <Placeholder>email@issifiss.com</Placeholder>.
        </p>
      </Seccion>

      <Seccion titulo="6. Naturaleza del servicio">
        <p>
          El sitio web es un canal de solicitud de citas e información general sobre los servicios
          ofrecidos; el contenido publicado no constituye ni sustituye una valoración, diagnóstico o
          consejo médico individualizado, que solo puede realizarse en consulta presencial.
        </p>
      </Seccion>

      <Seccion titulo="7. Propiedad intelectual">
        <p>
          Los contenidos, marca y diseño del sitio web están protegidos conforme a lo indicado en el{" "}
          <a href="/aviso-legal" className="font-medium text-sage-700 underline underline-offset-2">
            aviso legal
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="8. Modificación de estos términos">
        <p>
          Podemos actualizar estos términos y condiciones cuando sea necesario para reflejar cambios en el
          servicio o en la normativa aplicable. La versión vigente es siempre la publicada en esta página,
          junto con su fecha de última actualización.
        </p>
      </Seccion>

      <Seccion titulo="9. Legislación aplicable y jurisdicción">
        <p>
          Estos términos se rigen por la legislación española. Para cualquier controversia derivada de su
          interpretación o cumplimiento, las partes se someten a los Juzgados y Tribunales de{" "}
          <Placeholder>ciudad</Placeholder>, salvo que la normativa de consumidores y usuarios establezca un
          fuero distinto de carácter irrenunciable.
        </p>
      </Seccion>
    </LegalLayout>
  );
}
