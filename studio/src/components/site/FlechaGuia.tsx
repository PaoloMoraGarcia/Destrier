'use client';

import { useEffect, useRef, useState } from 'react';

import { subscribe, useReducedMotion } from './motion';

/**
 * La línea que une los bloques numerados y se dibuja con el scroll.
 *
 * `01 ──────▸ 02 ──────▸ 03`. Avanza conforme bajas y **se queda a medias si
 * paras**, como todo lo demás de esta página: sale del mismo registro de
 * `motion.tsx`, no de una animación que se lanza al entrar.
 *
 * Está para guiar la vista de un bloque al siguiente, que es lo que se pidió: que
 * llame la atención sobre lo que se vende.
 *
 * ## Las coordenadas se miden, no se calculan
 *
 * La línea va del primer número al último, y dónde caen esos números depende de
 * cuántas columnas haya, del ancho de la ventana y de lo que ocupe el texto en
 * cada idioma. Escribir las posiciones a mano significaría acertarlas en una
 * pantalla y fallarlas en las demás.
 *
 * Se leen del DOM y se vuelven a leer al cambiar de tamaño. **Y de ahí sale
 * también la orientación**: si los dos números están a la misma altura, la línea
 * es horizontal; si están uno debajo de otro —los bloques apilados en móvil—, es
 * vertical. No hay un punto de ruptura escrito en ningún sitio, y por eso no se
 * puede desincronizar del de la rejilla.
 *
 * ## Con movimiento reducido
 *
 * Sale entera desde el principio. La línea es una ayuda para leer, no un adorno:
 * quitarla del todo dejaría a esas personas sin la guía, y dibujarla con el scroll
 * es justo el movimiento que han pedido no tener.
 */

/** Lo que mide la punta de la flecha. */
const PUNTA = 9;

export function FlechaGuia({ contenedor }: { contenedor: React.RefObject<HTMLElement | null> }) {
  const svg = useRef<SVGSVGElement>(null);
  const trazo = useRef<SVGPathElement>(null);
  const punta = useRef<SVGPolygonElement>(null);
  const reduced = useReducedMotion();

  // La geometría vive en estado porque cambia el marcado —el `d` del trazo—, no
  // solo un estilo. Se recalcula al montar y al cambiar de tamaño, nunca por
  // fotograma.
  const [linea, setLinea] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;

    const medir = () => {
      const numeros = Array.from(raiz.querySelectorAll<HTMLElement>('[data-numero]'));
      if (numeros.length < 2) return setLinea(null);

      const caja = raiz.getBoundingClientRect();
      const primero = numeros[0].getBoundingClientRect();
      const ultimo = numeros[numeros.length - 1].getBoundingClientRect();

      /*
       * **Si los bloques están apilados, no hay flecha.**
       *
       * Cuando caben en una fila, la línea va de uno a otro y guía la vista, que
       * es para lo que está. Apilados, la versión vertical acababa dibujada
       * encima del párrafo del primer bloque: una raya cruzando el texto. Peor
       * que no tenerla.
       */
      const horizontal = Math.abs(primero.top - ultimo.top) < 20;
      if (!horizontal) return setLinea(null);

      /*
       * A qué altura va la línea.
       *
       * A la altura de los números cruzaba por encima del `02` del bloque de en
       * medio y se leía como un tachado, así que va por encima. Los 40 px caben
       * siempre porque la rejilla lleva 140 de margen por arriba — antes no los
       * llevaba en la sección de servicios, y ahí la línea no tenía dónde
       * meterse: **ese era el fallo de verdad**, no la altura de la línea.
       */
      const separacion = 40;

      setLinea({
        // De borde a borde de la fila: cuanto más larga, más guía. Antes iba del
        // primer número al último y se quedaba corta por los dos lados.
        x1: primero.left - caja.left,
        y1: primero.top - caja.top - separacion,
        x2: ultimo.right - caja.left,
        y2: ultimo.top - caja.top - separacion,
      });
    };

    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [contenedor]);

  useEffect(() => {
    const raiz = contenedor.current;
    const camino = trazo.current;
    const flecha = punta.current;
    if (!raiz || !camino || !flecha || !linea) return;

    const largo = camino.getTotalLength();
    camino.style.strokeDasharray = String(largo);

    if (reduced) {
      camino.style.strokeDashoffset = '0';
      flecha.style.opacity = '1';
      const fin = camino.getPointAtLength(largo);
      flecha.style.transform = `translate(${fin.x}px, ${fin.y}px)`;
      return;
    }

    return subscribe({
      node: raiz,
      // Empieza cuando el bloque asoma bien y termina antes de irse: la línea
      // tiene que estar completa mientras los tres bloques se leen, no cuando ya
      // están saliendo por arriba.
      startAt: 0.85,
      span: 0.45,
      rise: 0,
      offset: 0,
      paint: (p) => {
        camino.style.strokeDashoffset = String(largo * (1 - p));

        const cabeza = camino.getPointAtLength(largo * p);
        flecha.style.opacity = p > 0.02 ? '1' : '0';
        flecha.style.transform = `translate(${cabeza.x}px, ${cabeza.y}px)`;
      },
    });
  }, [contenedor, linea, reduced]);

  if (!linea) return null;

  return (
    <svg
      ref={svg}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path
        ref={trazo}
        d={`M ${linea.x1} ${linea.y1} L ${linea.x2} ${linea.y2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />
      <polygon
        ref={punta}
        points={`0,-${PUNTA / 2} ${PUNTA},0 0,${PUNTA / 2}`}
        fill="currentColor"
        opacity="0"
      />
    </svg>
  );
}
