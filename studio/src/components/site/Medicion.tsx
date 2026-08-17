import Script from 'next/script';

/**
 * La analítica de la landing. **Sin ella todo lo demás se decide a ciegas.**
 *
 * Hasta ahora no había ninguna: ni cuánta gente entra, ni cuánta baja hasta el
 * formulario, ni cuánta pulsa agendar. Se puede escribir la mejor página del
 * mundo y no saber nunca si funciona.
 *
 * ## Por qué Plausible y no Google Analytics
 *
 * - **No usa cookies ni guarda datos personales**, así que no hace falta un
 *   banner de consentimiento. Un banner en una página de cuatro pantallas es lo
 *   primero que ve quien entra, y tapa el titular.
 * - Son **menos de 1 KB**. El de Google son unos 50, y esta página se ha estado
 *   peleando por milisegundos de vídeo.
 * - Los datos son de quien paga, no del que los recoge.
 *
 * ## Cómo se enciende
 *
 * Con `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` en el entorno, y con el dominio de verdad
 * —`destrier.es`, o el que sea— como valor. **Sin esa variable no se carga
 * nada**: en local no se ensucian las cifras y el camino sin configuración, que es
 * una regla del proyecto, sigue intacto.
 *
 * Se puede cambiar de proveedor tocando solo este archivo: lo que el resto de la
 * página usa es `medir()` —en `medir.ts`, aparte a propósito—, que no sabe quién
 * está escuchando. Y va aparte porque lo importan componentes de cliente:
 * arrastrar `next/script` al paquete del navegador no pinta nada.
 */

export function Medicion() {
  const dominio = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!dominio) return null;

  return (
    <Script
      defer
      data-domain={dominio}
      src="https://plausible.io/js/script.outbound-links.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}
