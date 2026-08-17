'use client';

import type { Textos } from '@/lib/textos';

import { medir } from './medir';
import { EASE, irA } from './motion';

/**
 * El bloque de la llamada, en `#idea`.
 *
 * Viene de un componente de shadcn —rótulo, titular, párrafo y dos acciones— y
 * sustituye al enlace suelto de *«Agendar una llamada»* que había ahí.
 *
 * ## Qué se cambió al traerlo, y por qué
 *
 *  - **El `Badge` no es una píldora.** Una píldora con fondo en una página de dos
 *    colores es el ámbar otra vez, y el ámbar se retiró justo por eso. Se usa el
 *    rótulo en monoespaciada y versales que ya llevan las cuatro secciones.
 *  - **`bg-muted` no existe aquí.** El panel del original es gris claro; sobre la
 *    sección tinta eso sería un rectángulo gris en medio del negro. El panel se
 *    dibuja con un borde de 1 px en hueso al 12 %, sin relleno.
 *  - **Nada de `cn()`, `cva` ni `@radix-ui/react-slot`.** Dos variantes de botón
 *    son un ternario, y para un enlace no hace falta `asChild`. El icono es un SVG
 *    escrito a mano, como la flecha de `BotonFlecha.tsx`: `lucide-react` para dos
 *    iconos es una dependencia entera por doce líneas.
 *
 * ## Y el texto no repite el mensaje
 *
 * El original dice otra vez lo que vende. Aquí, a media pantalla de *«Destrier
 * construye el sistema…»*, eso no aporta nada. Lo que sí falta en esta página es
 * **contestar la duda**: qué pasa en esos treinta minutos, cuánto cuesta de tiempo
 * y qué ocurre si no encaja. Sin clientes que enseñar ni precio publicado, la
 * transparencia del proceso es lo único que baja la ansiedad de quien duda.
 *
 * ## Los colores van en `style`
 *
 * El botón macizo es hueso sobre tinta. Esta página ya tuvo **dos veces** un botón
 * negro sobre negro porque el fondo era una clase de Tailwind que no llegó a la
 * hoja de estilos: invisible, y sin que nada falle ni avise.
 */

const TINTA = '#0a0a0a';
const HUESO = '#f4f4ef';

/** El icono del teléfono, doce líneas y ninguna dependencia. */
function Telefono() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      // El tamaño en `style`: un `<svg>` sin medida no sale pequeño, sale a
      // 300x150 y revienta el botón. Esto no puede depender de una clase.
      style={{ width: '1em', height: '1em', flexShrink: 0 }}>
      <path d="M5.2 2.5 6.6 5.3 5.1 6.6c.6 1.5 1.8 2.7 3.3 3.3l1.3-1.5 2.8 1.4c0 1.6-1.2 2.7-2.7 2.6C6 12.1 3.9 10 3.1 5.2 3 3.7 3.9 2.5 5.2 2.5Z" />
    </svg>
  );
}

/** Y la flecha, la misma que la del botón de la flecha. */
function Flecha() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      // El tamaño en `style`: un `<svg>` sin medida no sale pequeño, sale a
      // 300x150 y revienta el botón. Esto no puede depender de una clase.
      style={{ width: '1em', height: '1em', flexShrink: 0 }}>
      <path d="M4 12 12 4" />
      <path d="M5.5 4H12v6.5" />
    </svg>
  );
}

/**
 * Con qué está construido.
 *
 * De la fila de tecnologías del `Hero01` que llegó de fuera, y aquí hace un trabajo
 * distinto del decorativo: en una página **sin un solo cliente que enseñar**, esto
 * es de lo poco que puede hacer de prueba — está construida con eso y se ve al
 * abrirla.
 *
 * Va con lo que el proyecto usa de verdad, no con la lista del ejemplo. Y **sin
 * logotipos**: son marcas de terceros, y cinco logos ajenos en una página que hasta
 * ahora solo tiene su propio nombre desordenan la jerarquía. En monoespaciada
 * separados por `·`, que es el mismo lenguaje que los `01 · 02 · 03`.
 */
function Tecnologias({ etiqueta, lista }: { etiqueta: string; lista: string[] }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 40 }}>
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-60">{etiqueta}</p>

      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[13px] tracking-[0.06em] opacity-75">
        {lista.map((nombre, i) => (
          <span key={nombre} className="flex items-center gap-3">
            {i > 0 && (
              <span aria-hidden className="opacity-50">
                &middot;
              </span>
            )}
            {nombre}
          </span>
        ))}
      </p>
    </div>
  );
}

export function BloqueLlamada({
  textos,
  agenda,
}: {
  textos: Textos['llamada'];
  /** El enlace de Calendly, que baja de `Landing.tsx`. */
  agenda: string;
}) {
  return (
    <div
      // Una marca para poder medirlo: las comprobaciones lo buscaban subiendo desde
      // el botón y acababan cogiendo el envoltorio de las acciones.
      data-bloque-llamada
      className="mx-auto flex flex-col items-center text-center"
      /*
       * **Toda la geometría del panel va aquí, y esto no es una manía.**
       *
       * Se vio roto en Safari: esquinas en pico, sin relleno y con los cuatro
       * bloques pegados unos a otros. La hoja de estilos del servidor tenía las
       * clases —comprobado—, pero ese navegador servía una versión anterior en
       * caché, y el patrón lo delata: lo que seguía funcionando eran las clases que
       * ya existían en otras piezas (`mt-14`, `max-w-3xl`) y lo que se caía era
       * **exactamente lo que este componente introdujo** (`gap-7`, `py-12`,
       * `rounded-[2rem]`).
       *
       * Es la quinta vez que este proyecto se lleva un golpe así, después del fondo
       * del botón, las columnas de los servicios y la medida del párrafo. La regla
       * ya está escrita: lo que no se puede permitir fallar no va en una clase. Un
       * panel es su relleno y su radio — sin ellos no es un panel, es una raya
       * alrededor del texto.
       */
      style={{
        maxWidth: '48rem',
        borderRadius: '2rem',
        border: `1px solid ${HUESO}1f`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: 'clamp(2.5rem, 4vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)',
      }}>
      <p className="font-mono text-[13px] uppercase tracking-[0.28em] opacity-65">
        {textos.eyebrow}
      </p>

      <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="text-[clamp(1.9rem,3.4vw,2.9rem)] font-medium leading-[1.1] tracking-[-0.03em]">
          {textos.titular}
        </p>

        {/* `max-w` en caracteres: un párrafo de más de unos 60 se lee peor por
            largo que la línea, no por tamaño. */}
        <p className="mx-auto max-w-[52ch] text-[clamp(1.05rem,1.4vw,1.2rem)] leading-relaxed opacity-75">
          {textos.cuerpo}
        </p>
      </div>

      {/* Las dos acciones. El reparto también en `style`: si el `gap` se pierde,
          los dos botones se tocan y se leen como uno solo partido. */}
      <div
        className="flex flex-col items-stretch sm:flex-row sm:items-center"
        style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* La acción principal: maciza, y con los colores en `style`. */}
        <a
          href={agenda}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => medir('agendar')}
          className="inline-flex items-center justify-center whitespace-nowrap font-medium tracking-[-0.01em]"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 52,
            padding: '0 2rem',
            borderRadius: 9999,
            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
            whiteSpace: 'nowrap',
            background: HUESO,
            color: TINTA,
            transition: `opacity 400ms ${EASE}`,
          }}>
          {textos.agendar}
          <Telefono />
        </a>

        {/* Y la de contorno, que baja al formulario. Para quien no quiere una
            llamada todavía: el listón más bajo de la página. */}
        <a
          href="#contact"
          onClick={(event) => {
            event.preventDefault();
            irA('#contact');
          }}
          className="inline-flex items-center justify-center whitespace-nowrap font-medium tracking-[-0.01em]"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 52,
            padding: '0 2rem',
            borderRadius: 9999,
            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
            whiteSpace: 'nowrap',
            border: `1px solid ${HUESO}59`,
            color: HUESO,
            transition: `border-color 400ms ${EASE}`,
          }}>
          {textos.escribir}
          <Flecha />
        </a>
      </div>

      <Tecnologias etiqueta={textos.construidaCon} lista={textos.tecnologias} />
    </div>
  );
}
