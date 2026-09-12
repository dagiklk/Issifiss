import LegalLayout, { Seccion, Placeholder } from "../../components/legal/LegalLayout.jsx";

export default function AvisoLegal() {
  return (
    <LegalLayout titulo="Aviso legal">
      <Seccion titulo="1. Datos identificativos del titular">
        <p>
          En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de
          julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se
          exponen a continuación los datos identificativos del titular del sitio web <strong>issifiss</strong>:
        </p>
        <ul className="flex flex-col gap-1.5">
          <li>
            <strong>Titular:</strong> <Placeholder>Nombre completo o razón social</Placeholder>
          </li>
          <li>
            <strong>NIF/CIF:</strong> <Placeholder>NIF/CIF</Placeholder>
          </li>
          <li>
            <strong>Domicilio:</strong> <Placeholder>Dirección completa</Placeholder>
          </li>
          <li>
            <strong>Colegiado nº:</strong> <Placeholder>Número de colegiado y colegio profesional</Placeholder>
          </li>
          <li>
            <strong>Email de contacto:</strong> <Placeholder>email@issifiss.com</Placeholder>
          </li>
          <li>
            <strong>Teléfono:</strong> <Placeholder>Teléfono de contacto</Placeholder>
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="2. Objeto y ámbito de aplicación">
        <p>
          Este aviso legal regula el acceso y uso del sitio web issifiss (en adelante, "el sitio web"), a
          través del cual se ofrece información sobre los servicios de fisioterapia del titular y se
          permite la solicitud de citas online. El acceso al sitio web y/o el uso de sus servicios atribuye
          la condición de usuario y supone la aceptación plena de este aviso legal.
        </p>
      </Seccion>

      <Seccion titulo="3. Condiciones de acceso y uso">
        <p>
          El sitio web y sus servicios son de acceso libre y gratuito, salvo en lo relativo a la solicitud
          de citas, que requiere la aportación de determinados datos personales conforme a lo indicado en
          la{" "}
          <a href="/privacidad" className="font-medium text-sage-700 underline underline-offset-2">
            política de privacidad
          </a>
          . El usuario se compromete a hacer un uso adecuado y lícito del sitio web, así como a facilitar
          información veraz en los formularios de contacto y reserva, y a no emplear el sitio web con
          fines fraudulentos o lesivos para terceros.
        </p>
      </Seccion>

      <Seccion titulo="4. Propiedad intelectual e industrial">
        <p>
          Todos los contenidos del sitio web (textos, imágenes, logotipos, diseño e código fuente) son
          titularidad del titular del sitio web o de terceros que han autorizado su uso, y están protegidos
          por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción,
          distribución o transformación total o parcial sin autorización expresa, salvo para uso personal y
          privado.
        </p>
      </Seccion>

      <Seccion titulo="5. Exclusión de responsabilidad">
        <p>
          La información publicada en el sitio web tiene carácter meramente divulgativo y no sustituye, en
          ningún caso, una valoración o diagnóstico presencial realizado por un profesional sanitario. El
          titular no se hace responsable del uso que los usuarios hagan de dicha información ni de las
          decisiones adoptadas a partir de la misma.
        </p>
        <p>
          El titular tampoco se responsabiliza de interrupciones del servicio, errores u omisiones en los
          contenidos, ni de los daños derivados del acceso a sitios web de terceros enlazados desde el
          sitio web (por ejemplo, redes sociales), sobre cuyo contenido no ejerce ningún control.
        </p>
      </Seccion>

      <Seccion titulo="6. Legislación aplicable y jurisdicción">
        <p>
          Este aviso legal se rige por la legislación española. Para la resolución de cualquier
          controversia relacionada con el sitio web, las partes se someten a los Juzgados y Tribunales de{" "}
          <Placeholder>ciudad</Placeholder>, salvo que la normativa de consumidores y usuarios establezca
          un fuero distinto de carácter irrenunciable.
        </p>
      </Seccion>
    </LegalLayout>
  );
}
