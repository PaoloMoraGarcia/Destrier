import type { Idioma } from './textos';

/**
 * Elegir idioma, **sin tocar la petición**.
 *
 * Aquí solo hay constantes y funciones puras, y el archivo está partido en dos
 * por la misma razón que `landing.ts` y `landing.server.ts`: el selector del pie
 * es un componente de cliente y necesita el nombre de la cookie. Cuando esto y
 * `next/headers` estaban en el mismo módulo, importar el nombre de la cookie
 * arrastraba la API de servidor al navegador y la página devolvía un 500.
 *
 * **`tsc` no lo ve.** El límite entre cliente y servidor no es de tipos, así que
 * la comprobación de tipos pasó limpia y el fallo solo salió al pedir la página.
 * Lo que separa los dos archivos es el `import`, no el `.server` del nombre.
 *
 * Lo que lee la petición está en `idioma.server.ts`.
 *
 * ## Sin prefijo en la URL
 *
 * La página sigue siendo `/` en los dos idiomas. Con `/es` y `/en` habría habido
 * que reservar esos dos handles en `0008` — la ruta pública es `/[handle]/[slug]`
 * y quien se llamara `es` se quedaría sin página.
 */

export const COOKIE_IDIOMA = 'destrier-idioma';

/** Un año. El idioma en el que alguien lee no cambia entre visita y visita. */
export const COOKIE_MESES = 60 * 60 * 24 * 365;

/**
 * Recuerda el idioma elegido y vuelve a pedir la página.
 *
 * **Vive aquí y no en el componente** por dos razones que apuntan al mismo sitio.
 * La de forma: escribir la cookie es una función pura de navegador y no tiene nada
 * que ver con pintar; el nombre y la caducidad ya estaban en este archivo, así que
 * el que escribe es quien las define. Y la de fondo: `document.cookie = …` dentro
 * de un componente es una **mutación de algo que el componente no posee**, y las
 * reglas nuevas de React la marcan con razón — el compilador no puede saber que
 * eso es seguro.
 *
 * Se recarga entero y no con `router.refresh()`: el idioma se lee en el servidor y
 * baja por propiedades desde la raíz de la página, así que una navegación blanda
 * podría dejar media página en un idioma y media en el otro.
 *
 * `SameSite=Lax` y sin `Secure`: en desarrollo la página va por http, y con
 * `Secure` el navegador tira la cookie sin decir nada.
 */
export function recordarIdioma(siguiente: Idioma) {
  document.cookie = `${COOKIE_IDIOMA}=${siguiente}; path=/; max-age=${COOKIE_MESES}; samesite=lax`;
  window.location.reload();
}

const SOPORTADOS: Idioma[] = ['en', 'es'];

function esIdioma(valor: string | undefined): valor is Idioma {
  return valor === 'en' || valor === 'es';
}

/**
 * El idioma que pide el navegador, si es uno de los dos.
 *
 * `Accept-Language` viene ordenado por preferencia con pesos —
 * `es-ES,es;q=0.9,en;q=0.8`—, y **el orden de escritura no es el orden de
 * preferencia**: sin `q` el peso es 1, así que hay que ordenar. Coger el primero
 * a secas funcionaría en la mayoría de los casos y fallaría en cuanto alguien
 * tenga una lista de tres idiomas puesta a mano.
 *
 * Se compara solo la parte de delante: `es-419` y `es-ES` son español.
 */
export function delNavegador(accept: string | null): Idioma | null {
  if (!accept) return null;

  const preferencias = accept
    .split(',')
    .map((entrada) => {
      const [etiqueta, ...parametros] = entrada.trim().split(';');
      const q = parametros.find((p) => p.trim().startsWith('q='));
      const peso = q ? Number.parseFloat(q.trim().slice(2)) : 1;

      return {
        base: etiqueta.trim().toLowerCase().split('-')[0],
        peso: Number.isFinite(peso) ? peso : 0,
      };
    })
    .filter((p) => p.peso > 0)
    .sort((a, b) => b.peso - a.peso);

  return preferencias.find((p) => esIdioma(p.base))?.base as Idioma | undefined ?? null;
}

/**
 * Decide el idioma. **Español salvo que se pida otra cosa.**
 *
 * La página se sirve en español por defecto —el cliente al que se dirige está
 * aquí— y solo cambia si quien entra lo pide con el selector del pie, que deja la
 * cookie puesta.
 *
 * `Accept-Language` **ya no decide nada**, y es un cambio deliberado. Estaba, y
 * lo que hacía era que la página apareciera en un idioma u otro según con qué
 * ordenador te sentaras: imposible saber qué se está enseñando sin mirar la
 * cabecera de la petición. El punto de partida es fijo y predecible; el inglés
 * está a un clic.
 *
 * `delNavegador` sigue aquí, sin llamar a nadie, porque volver a activarlo es
 * cambiar una línea y lo que costó fue escribir bien el orden por pesos.
 */
export function elegirIdioma(cookie: string | undefined, _accept?: string | null): Idioma {
  return esIdioma(cookie) ? cookie : 'es';
}

export { SOPORTADOS };
