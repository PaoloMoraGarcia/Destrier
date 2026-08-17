import type { Metadata } from 'next';

import { Landing } from '@/components/site/Landing';
import { Medicion } from '@/components/site/Medicion';
import { textosActuales } from '@/lib/idioma.server';
import { isConfigured } from '@/lib/supabase';

/*
 * Los metadatos también cambian de idioma.
 *
 * Es lo que se ve en la pestaña y lo que sale al pegar el enlace en un chat, así
 * que dejarlos fijos en inglés sería tener la mitad visible de la página sin
 * traducir. `generateMetadata` lee la misma cookie y la misma cabecera que el
 * cuerpo, así que las dos cosas dicen siempre lo mismo.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { idioma, textos } = await textosActuales();

  return {
    title: textos.meta.titulo,
    description: textos.meta.descripcion,
    openGraph: {
      // El título y la descripción de la tarjeta son **los mismos** que los de la
      // página. Estuvieron sueltos —`'Destrier'` y el lema— y eso dejaba lo que se
      // ve al compartir sin decir qué se vende, que es justo lo que hay que decir
      // ahí. La imagen la genera `opengraph-image.tsx`, al lado de este archivo.
      title: textos.meta.titulo,
      description: textos.meta.descripcion,
      type: 'website',
      locale: idioma === 'es' ? 'es_ES' : 'en_US',
    },
    // Twitter y quien lo copie: sin esto la tarjeta sale pequeña y sin imagen.
    twitter: { card: 'summary_large_image' },
  };
}

export default async function HomePage() {
  /*
   * Dos cosas se deciden **aquí**, en el servidor, y bajan como propiedades.
   *
   * El idioma, porque solo el servidor ve la cabecera `Accept-Language`: hacerlo
   * en el cliente significaría pintar la página en inglés y cambiarla a español
   * un momento después, delante de quien la está leyendo.
   *
   * Y si hay backend. El formulario podría averiguarlo al enviar —la acción
   * devuelve `sin-configuracion`—, pero entonces quien entra pulsa una vez, no
   * pasa nada visible y solo después aparece el enlace de correo. Sabiéndolo
   * desde el principio, el botón es el correcto ya en el primer pintado.
   */
  const { idioma, textos } = await textosActuales();

  return (
    <>
      {/* La analítica va aquí y no en el `layout`: el panel del creador no se
          mide, y sus cifras ensuciarían las de la página pública. */}
      <Medicion />
      <Landing idioma={idioma} textos={textos} hayBackend={isConfigured} />
    </>
  );
}
