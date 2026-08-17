'use client';

import { recordarIdioma } from '@/lib/idioma';
import type { Idioma } from '@/lib/textos';

/**
 * `EN · ES` en el pie.
 *
 * **La detección automática sola es una trampa.** Acierta la mayoría de las
 * veces y cuando falla no hay salida: un español con el portátil en inglés se
 * queda leyendo en inglés sin nada que tocar. Por eso el selector no es un extra
 * del idioma automático — es la mitad que lo hace utilizable.
 *
 * Escribe la cookie y recarga. No es un `router.refresh()` porque el idioma se
 * lee en el servidor y baja por propiedades desde la raíz de la página: recargar
 * es exactamente lo que hace falta y no deja media página en un idioma y media
 * en otro.
 *
 * ## Son botones, no enlaces
 *
 * Fueron `<a href="/">` con `preventDefault`, con el argumento de que así
 * funcionaban aunque el manejador no corriera. Pero **la página es `/` en los dos
 * idiomas**: ese enlace apunta a donde ya estás, así que sin JavaScript no
 * cambiaba nada — no había fallo suave, había un enlace que no hacía nada. Y para
 * un buscador, un enlace a sí mismo no aporta nada tampoco.
 *
 * Lo que esto hace es **una acción**: recuerda una preferencia y vuelve a pedir la
 * página. Eso es un `<button>`, y de paso desaparece el aviso de Next sobre no
 * navegar a una ruta con `<a>`.
 */

const NOMBRES: Record<Idioma, string> = { en: 'EN', es: 'ES' };

export function SelectorIdioma({ idioma, etiqueta }: { idioma: Idioma; etiqueta: string }) {
  return (
    // `-my-3` y `min-h-[44px]` por lo mismo que los enlaces del pie: `EN` y `ES`
    // medían 18x16 px, muy por debajo del objetivo de 44 que pide la pauta de
    // accesibilidad. El `px-2` además los separa entre sí.
    <div className="-my-3 flex items-center gap-1 font-mono text-xs uppercase tracking-[0.16em]">
      <span className="sr-only">{etiqueta}</span>

      {(Object.keys(NOMBRES) as Idioma[]).map((clave, index) => (
        <span key={clave} className="flex items-center">
          {index > 0 && (
            <span aria-hidden className="opacity-60">
              &middot;
            </span>
          )}

          <button
            type="button"
            lang={clave}
            // `aria-current` en un botón lo entienden los lectores de pantalla
            // igual que en un enlace: dice cuál de los dos está puesto.
            aria-current={clave === idioma ? 'true' : undefined}
            onClick={() => recordarIdioma(clave)}
            className={`flex min-h-[44px] items-center px-2 ${
              clave === idioma ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            }`}>
            {NOMBRES[clave]}
          </button>
        </span>
      ))}
    </div>
  );
}
