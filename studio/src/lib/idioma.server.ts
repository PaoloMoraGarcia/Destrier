import { cookies, headers } from 'next/headers';

import { COOKIE_IDIOMA, elegirIdioma } from './idioma';
import { TEXTOS, type Idioma, type Textos } from './textos';

/**
 * El idioma leído de la petición.
 *
 * ## Por qué no está en `proxy.ts`
 *
 * Era el sitio evidente y es el equivocado. El `proxy` de este proyecto
 * existe para refrescar el token de Supabase y **se sale antes de tiempo cuando
 * no hay `.env.local`** — que es el camino de la muestra, el que tiene que seguir
 * funcionando. El idioma metido ahí se apagaría justo en el único montaje donde
 * no hay backend. Y para escribir un idioma en una cabecera y volver a leerlo dos
 * capas más abajo habría que tocar el archivo del que depende entrar al panel, a
 * cambio de nada.
 *
 * Leyendo la cookie y la cabecera aquí lo lee quien lo necesita, no hay estado
 * intermedio que pueda quedarse desfasado, y la sesión del panel no se roza.
 *
 * **El precio, que es real:** `cookies()` y `headers()` son dinámicos, así que la
 * página que llame a esto deja de renderizarse en estático. Solo la llama `/`.
 */
export async function idiomaActual(): Promise<Idioma> {
  const [galletas, cabeceras] = await Promise.all([cookies(), headers()]);

  return elegirIdioma(galletas.get(COOKIE_IDIOMA)?.value, cabeceras.get('accept-language'));
}

/** El idioma y sus textos, que es lo que quiere quien renderiza la página. */
export async function textosActuales(): Promise<{ idioma: Idioma; textos: Textos }> {
  const idioma = await idiomaActual();
  return { idioma, textos: TEXTOS[idioma] };
}
