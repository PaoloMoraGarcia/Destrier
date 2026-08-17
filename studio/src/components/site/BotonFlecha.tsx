'use client';

import { useState } from 'react';

import { medir } from './medir';
import { EASE, useReducedMotion } from './motion';

/**
 * El botón con la flecha que viaja.
 *
 * En reposo, la etiqueta a la izquierda y un círculo con la flecha pegado al
 * borde derecho. Al pasar el cursor el círculo cruza el botón hasta la izquierda
 * y la flecha gira 45°.
 *
 * ## Los colores van en `style`, y esto no es una manía
 *
 * Este botón se vio **negro sobre negro dos veces**: la etiqueta y el fondo son
 * clases de Tailwind, y cuando esas clases no llegan a la hoja de estilos el
 * fondo desaparece y queda texto oscuro sobre una sección oscura. Invisible, sin
 * que nada falle ni avise.
 *
 * Los colores y las medidas que **no pueden fallar** van por `style` en línea:
 * eso lo pinta el navegador con el marcado, sin compilar nada. Tailwind sigue
 * llevando lo demás. Es fea la mezcla y es lo correcto aquí — un botón que es la
 * única acción de su sección no puede depender de que un compilador haya visto
 * una cadena de texto.
 *
 * ## El movimiento va en estado, no en `:hover`
 *
 * Por lo mismo: `group-hover:right-[calc(100%-3.5rem)]` es una clase arbitraria
 * con una función dentro, de las más fáciles de perder. Con `onPointerEnter` el
 * desplazamiento es una cuenta de JavaScript y se aplica sí o sí.
 */

/** Lo que mide el círculo, y de cuánto es el hueco que se le deja. */
const CIRCULO = 48;
const BORDE = 8;

export function BotonFlecha({
  href,
  children,
  externo = false,
}: {
  href: string;
  children: React.ReactNode;
  /** Si sale del sitio: pestaña nueva y `noopener`. */
  externo?: boolean;
}) {
  const [dentro, setDentro] = useState(false);
  const reduced = useReducedMotion();
  const activo = dentro && !reduced;

  const hueco = CIRCULO + BORDE * 2;

  return (
    <a
      href={href}
      {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      // Agendar es **una de las dos únicas conversiones** de la página, así que se
      // cuenta. Va en el propio enlace y no en un envoltorio: donde se pulsa es
      // donde se mide, y así no hay forma de añadir un botón nuevo y olvidarse.
      onClick={() => medir('agendar')}
      onPointerEnter={() => setDentro(true)}
      onPointerLeave={() => setDentro(false)}
      onFocus={() => setDentro(true)}
      onBlur={() => setDentro(false)}
      className="group relative inline-flex w-fit items-center overflow-hidden font-medium"
      style={{
        height: CIRCULO + BORDE * 2,
        borderRadius: 999,
        background: '#f4f4ef',
        color: '#0a0a0a',
        fontSize: 17,
        paddingInlineStart: activo ? hueco : 28,
        paddingInlineEnd: activo ? 28 : hueco,
        transition: reduced ? undefined : `padding 500ms ${EASE}`,
      }}>
      <span className="relative z-10 whitespace-nowrap">{children}</span>

      <span
        aria-hidden
        className="absolute flex items-center justify-center"
        style={{
          width: CIRCULO,
          height: CIRCULO,
          borderRadius: 999,
          background: '#0a0a0a',
          color: '#f4f4ef',
          // Desde el borde derecho hasta el izquierdo. `calc` en una propiedad de
          // verdad, no dentro del nombre de una clase.
          right: activo ? `calc(100% - ${CIRCULO + BORDE}px)` : BORDE,
          transform: activo ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: reduced ? undefined : `right 500ms ${EASE}, transform 500ms ${EASE}`,
        }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M4 12 12 4" />
          <path d="M5.5 4H12v6.5" />
        </svg>
      </span>
    </a>
  );
}
