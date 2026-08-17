'use client';

import { useEffect, useRef } from 'react';

import { useReducedMotion } from './motion';

/**
 * El portátil y el teléfono, en la sección que explica el servicio.
 *
 * Están ahí porque el texto dice *«la web, la página de acceso o el sistema
 * entero»* y esto es enseñarlo en vez de contarlo: lo que se construye se ve en
 * los dos sitios donde alguien lo va a abrir.
 *
 * ## Vienen con alfa, y la alfa hay que respetarla
 *
 * Los originales son ProRes 4444 **recortados**: no llevan fondo negro, llevan
 * transparencia. En web no hay formato de vídeo con alfa que pinte en todos los
 * navegadores, así que se componen **sobre el blanco de la página** al exportar,
 * no sobre negro. Si alguna vez se ven con un marco oscuro alrededor, la
 * exportación está mal, no el CSS.
 *
 * Y se recortan a la caja de su alfa antes de codificar. En el original el
 * teléfono ocupa 576 px de ancho de un fotograma de 2500: sin recortar se estaría
 * pagando el peso de un 4K para enseñar un móvil, y encima habría que ampliarlo
 * —que es lo que lo pondría borroso—. Cada uno sale a su tamaño real:
 *
 *  - el portátil, 1776x1088
 *  - el teléfono, 576x1152
 *
 * ## Alineados por abajo
 *
 * Los dos aparatos apoyan en la misma línea, como si estuvieran sobre una mesa.
 * En vertical se apilan: uno al lado del otro en una pantalla de móvil deja los
 * dos tan pequeños que no se ve qué son.
 */

/** Lo que se enseña en cada uno. El `alt` va en el `aria-label` del contenedor. */
const APARATOS = [
  { src: '/video/mac-servicio.mp4', clase: 'w-full sm:w-[74%]' },
  { src: '/video/iphone.mp4', clase: 'w-[46%] sm:w-[21%]' },
];

export function Dispositivos({ etiqueta }: { etiqueta: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo || !reduced) return;

    // Quien ha pedido que no haya movimiento se queda con el primer fotograma.
    nodo.querySelectorAll('video').forEach((v) => v.pause());
  }, [reduced]);

  return (
    <div
      ref={raiz}
      role="img"
      aria-label={etiqueta}
      /*
       * **Más grandes, pero no a pantalla completa.**
       *
       * Estaban en `max-w-5xl` —1024 px— con el portátil al 68 %, y a 1990 de ancho
       * eso los dejaba pequeños en medio de mucho negro. Suben a 1400, que es donde
       * el conjunto ocupa en torno a tres cuartos del alto de la ventana: se ve que
       * son dos aparatos de verdad y **la frase de encima sigue en pantalla**, que
       * era la condición.
       *
       * El límite es el alto, no el ancho: si algún día se suben más, la medida que
       * lo delata es el alto del bloque contra el de la ventana — pasado el 85 % el
       * texto de arriba se sale y esto deja de leerse como una escena.
       */
      className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-8 sm:flex-row sm:items-end sm:gap-[4%]">
      {APARATOS.map((aparato) => (
        <div key={aparato.src} className={`relative ${aparato.clase}`}>
          <video
            src={aparato.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            // `block`: un `<video>` es `inline` por defecto y arrastra el espacio
            // de la línea base, que aquí desalinearía los dos aparatos.
            className="block w-full"
          />

          {/* El mismo difuminado que en la portada, y por lo mismo: el croma
              comprimido desvía el negro plano dos o tres niveles y eso dibuja el
              rectángulo del vídeo sobre la sección. Ver `Mac.tsx`. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                'linear-gradient(to bottom, #0a0a0a 0, rgba(10,10,10,0) 14px)',
                'linear-gradient(to top, #0a0a0a 0, rgba(10,10,10,0) 14px)',
                'linear-gradient(to right, #0a0a0a 0, rgba(10,10,10,0) 14px)',
                'linear-gradient(to left, #0a0a0a 0, rgba(10,10,10,0) 14px)',
              ].join(', '),
            }}
          />
        </div>
      ))}
    </div>
  );
}
