'use client';

import { useEffect, useRef } from 'react';

import { useReducedMotion } from './motion';

/**
 * Los arcos de la portada.
 *
 * Un abanico de arcos que sale del borde de abajo y barre despacio. Va en un
 * `<canvas>` porque son ~76 trazos redibujados en cada fotograma: con elementos
 * del DOM esto no se sostiene.
 *
 * ## Qué se cambió del original
 *
 * Llegó de fuera y se ha adaptado a las reglas de esta página, no al revés:
 *
 *  - **Se apaga con `prefers-reduced-motion`.** El original no lo miraba. Aquí
 *    se pinta **un solo fotograma** y se para: el dibujo se ve, el movimiento no.
 *    Es la misma decisión que en el resto de la página, y no es cortesía — con
 *    esta cantidad de movimiento es la diferencia entre una página y un mareo.
 *  - **El ratón no lo mueve.** El original seguía el cursor por toda la ventana.
 *    Detrás del titular eso es un fondo que se agita cada vez que mueves la mano
 *    mientras intentas leer. Los arcos barren solos, a su ritmo.
 *  - **Escucha el scroll de esta página, no el de la ventana.** Aquí la página
 *    scrollea en un contenedor propio con Lenis, así que un `scroll` en `window`
 *    no se dispara nunca.
 *
 * ## La legibilidad manda
 *
 * Los arcos van **detrás** del contenido y con un velo encima. Sin él, un trazo
 * blanco a plena luz cruzando por detrás de una letra blanca deja la letra
 * ilegible durante los fotogramas que dura. El velo es lo que hace que esto se
 * pueda poner detrás de un titular y no solo en una pantalla decorativa.
 *
 * Se para solo cuando la portada sale de pantalla o la pestaña pasa a segundo
 * plano, que es lo que evita que siga comiendo batería mientras lees el resto.
 */

const TWO_PI = Math.PI * 2;

const map = (v: number, a: number, b: number, c: number, d: number) =>
  ((v - a) / (b - a)) * (d - c) + c;

/** Cuántos arcos. En móvil bajan solos: son trazos, no adorno gratis. */
const ARCOS = 76;

/** El grosor y el brillo del barrido. */
const GROSOR = 1.5;
const RESPLANDOR = 10;
const VELOCIDAD = 6;

/** Tinta y hueso, los mismos de la página. */
const FONDO = '#0a0a0a';
const LINEA = { r: 244, g: 244, b: 239 };

export function Arcos() {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const contenedor = caja.current;
    const canvas = lienzo.current;
    if (!contenedor || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let ancho = 0;
    let alto = 0;
    let fotograma = 0;
    let bucle = 0;
    let enPantalla = true;
    let pestanaVisible = true;

    const medir = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = contenedor.getBoundingClientRect();
      ancho = r.width;
      alto = r.height;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pintar = () => {
      ctx.fillStyle = FONDO;
      ctx.fillRect(0, 0, ancho, alto);

      const movil = ancho < 768;
      const umbral = 55000 / RESPLANDOR;

      ctx.save();
      ctx.lineWidth = GROSOR;
      ctx.translate(ancho / 2, alto + (movil ? 60 : 40));

      const acotado = Math.max(320, Math.min(1440, ancho));
      const ritmo = map(acotado, 320, 1440, 0.002, 5e-4) * (VELOCIDAD / 5);
      const avance = fotograma * ritmo;
      const mitad = ancho / 2;
      const cuantos = movil ? Math.round(ARCOS * 0.6) : ARCOS;

      for (let k = 0; k < cuantos; k++) {
        const angulo = (map(k, 0, cuantos, 0, Math.PI) + avance) % Math.PI;
        const largo = Math.tan(angulo) * alto;
        const radio = Math.abs(largo) / 2;
        const centro = -alto / 2 + largo / 2;

        /*
         * En pantalla estrecha el abanico va más apagado.
         *
         * No es capricho: en una pantalla alta y estrecha los arcos convergen en
         * una franja muy brillante que cruza de lado a lado justo por debajo del
         * titular, y se lee como una línea del horizonte pegada al texto. A plena
         * intensidad eso compite con lo único que hay que leer ahí.
         *
         * Se apagan, no se quitan: siguen viéndose alrededor del portátil, que es
         * para lo que están.
         */
        const brillo =
          (Math.max(0, Math.min(255, map(Math.abs(largo), 0, umbral, -20, 255))) / 255) *
          (movil ? 0.45 : 1);
        if (brillo <= 0) continue;

        ctx.strokeStyle = `rgba(${LINEA.r}, ${LINEA.g}, ${LINEA.b}, ${brillo})`;

        // Un radio enorme es una recta: dibujarlo como arco cuesta miles de
        // segmentos para el mismo píxel.
        if (radio > 499999.5) {
          ctx.beginPath();
          ctx.moveTo(-mitad, -alto / 2);
          ctx.lineTo(mitad, -alto / 2);
          ctx.stroke();
          continue;
        }

        const recorte = Math.acos(Math.min(1, (mitad + 50) / radio));
        const segmentos = Math.max(Math.ceil(radio / 120), 200);

        for (const [desde, hasta] of [
          [recorte, Math.PI - recorte],
          [Math.PI + recorte, TWO_PI - recorte],
        ]) {
          const arco = hasta - desde;
          const n = Math.max(Math.ceil((arco / TWO_PI) * segmentos), 60);
          const paso = arco / n;

          ctx.beginPath();
          for (let s = 0; s <= n; s++) {
            const a = desde + paso * s;
            const x = Math.cos(a) * radio;
            const y = centro + Math.sin(a) * radio;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    medir();

    // Con movimiento reducido: un fotograma y se acabó. Se ve el dibujo, no el
    // barrido, y no queda ningún bucle corriendo.
    if (reduced) {
      pintar();
      const alRedimensionar = () => {
        medir();
        pintar();
      };
      window.addEventListener('resize', alRedimensionar, { passive: true });
      return () => window.removeEventListener('resize', alRedimensionar);
    }

    const paso = () => {
      fotograma += 1;
      pintar();
      bucle = requestAnimationFrame(paso);
    };

    const arrancar = () => {
      if (bucle || !enPantalla || !pestanaVisible) return;
      bucle = requestAnimationFrame(paso);
    };
    const parar = () => {
      if (!bucle) return;
      cancelAnimationFrame(bucle);
      bucle = 0;
    };

    let temporizador: ReturnType<typeof setTimeout>;
    const alRedimensionar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        medir();
        pintar();
      }, 100);
    };

    const alCambiarPestana = () => {
      pestanaVisible = document.visibilityState === 'visible';
      pestanaVisible && enPantalla ? arrancar() : parar();
    };

    const vigia = new IntersectionObserver(
      (entradas) => {
        enPantalla = entradas[0]?.isIntersecting ?? true;
        enPantalla && pestanaVisible ? arrancar() : parar();
      },
      { threshold: 0 }
    );

    vigia.observe(contenedor);
    window.addEventListener('resize', alRedimensionar, { passive: true });
    document.addEventListener('visibilitychange', alCambiarPestana);
    arrancar();

    return () => {
      parar();
      clearTimeout(temporizador);
      vigia.disconnect();
      window.removeEventListener('resize', alRedimensionar);
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, [reduced]);

  return (
    <div ref={caja} aria-hidden className="absolute inset-0 overflow-hidden" style={{ background: FONDO }}>
      <canvas ref={lienzo} className="block h-full w-full" />

      {/*
        Dos velos, y cada uno resuelve un problema distinto.

        **El radial**: sin él, un arco a plena luz pasando por detrás de una letra
        deja la letra ilegible mientras dura. Más denso en el centro, que es donde
        vive el titular, y transparente en los bordes para que los arcos se vean.

        **El de abajo**: atenúa el abanico hacia el pie de la portada, para que no
        compita con el aparato ni con el botón. **Ya no lo apaga.** Llegó a
        terminar en `#0a0a0a` opaco, y no era una decisión de diseño: era esconder
        el rectángulo del vídeo del portátil, que entonces era opaco y cortaba los
        arcos en línea recta. Ese apaño además no podía funcionar —dónde cae el
        borde del portátil depende de la forma de la ventana, del 40 % de la
        altura al 77 %— y se cambió por lo que había que hacer: **darle al
        portátil su transparencia de verdad** (ver `Mac.tsx`).
        Ahora los arcos siguen vivos a la altura del aparato y se ven a su
        alrededor, que es de lo que iban.

        Lo que sí tiene que apagarse **del todo al 100 %** es el final: ahí acaba
        la portada y empieza la sección negra, y un trazo a plena luz llegando a
        esa costura se corta en línea recta a lo ancho de toda la ventana. El
        abanico tiene que llegar apagado al borde, no cortado.
      */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 55% at 50% 38%, rgba(10,10,10,0.86) 0%, rgba(10,10,10,0.62) 45%, rgba(10,10,10,0) 100%)',
            'linear-gradient(to bottom, rgba(10,10,10,0) 30%, rgba(10,10,10,0.5) 72%, #0a0a0a 100%)',
          ].join(', '),
        }}
      />
    </div>
  );
}
