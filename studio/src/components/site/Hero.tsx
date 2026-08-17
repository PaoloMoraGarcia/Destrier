'use client';

import { Arcos } from './Arcos';
import { medir } from './medir';
import { Mac } from './Mac';
import { TeachSlot } from './TeachSlot';

/**
 * La portada.
 *
 * ## Hubo aquí una puerta, y se quitó
 *
 * Durante una pasada esto fue una pantalla de entrada que **cerraba el scroll**
 * hasta que escribieras algo. Dejaba la página inservible: con el contenedor en
 * `overflow: hidden`, todo lo de abajo existía y no había forma de llegar. Se
 * retiró entera.
 *
 * La lección no es que la idea fuera mala: es que se comprobaron las piezas por
 * separado —que la rueda no movía el scroll, que el avance pintaba, que el
 * teclado abría— y **nunca se abrió la página y se bajó de arriba abajo**. Un
 * mecanismo que bloquea el scroll no se puede verificar por partes: o recorres la
 * página entera, o no sabes si funciona.
 *
 * ## El titular es la pregunta de la página
 *
 * `I want to teach ___`, y el hueco lo rellena quien entra. Lo que se escriba
 * **baja al formulario del final**, que llega ya empezado. El valor vive en
 * `Landing.tsx`, porque lo comparten dos piezas que están en extremos opuestos.
 *
 * ## La portada es negra, y los arcos van detrás
 *
 * Fue blanca durante muchas pasadas, y con los arcos —que están pensados para
 * fondo oscuro— pasó a tinta.
 *
 * El portátil **ya no se compone contra ningún color**: lleva su alfa dentro del
 * propio vídeo y se recompone en la página, así que los arcos se ven a su
 * alrededor en cualquier navegador. Cómo, y por qué hubo que llegar hasta ahí,
 * está en `Mac.tsx`.
 *
 * Se ve **entero**, sin recortar, y va por encima del lienzo — un elemento
 * posicionado pinta sobre uno estático, así que necesita su `z`.
 *
 * ## El titular **no depende de JavaScript para verse**
 *
 * Esta es la regla dura de esta pieza, y viene de que se rompió. La entrada
 * escalonada la hacía un efecto: ponía las piezas a `opacity: 0` y las traía dos
 * fotogramas después con `requestAnimationFrame`. Cuando eso no llegaba a correr
 * —pestaña en segundo plano, hidratación lenta, un fallo en cualquier otro sitio
 * del árbol— **el titular se quedaba invisible para siempre**. Y el titular es la
 * primera línea de la página.
 *
 * Ahora el titular está y punto: no hay nada que le toque la opacidad. Lo que
 * entra es el portátil, y entra con una animación **de CSS**, que corre sola
 * aunque el JavaScript no aparezca. Con `prefers-reduced-motion` se apaga desde
 * la hoja de estilos.
 *
 * Si algún día se quiere animar el titular: que la animación **añada** movimiento
 * a algo ya visible, nunca que lo revele desde cero.
 *
 * Y con el fondo en tinta **se cayó la sombra de la costura**: existía para
 * disimular el canto recto del portátil contra el negro de la sección siguiente.
 * Ahora las dos son el mismo negro y no hay costura; la sombra sería una banda
 * oscura sobre un fondo ya oscuro.
 */

export function Hero({
  titular,
  ejemplos,
  etiquetaCampo,
  teach,
  alEscribir,
  agendarHref,
  agendarEtiqueta,
}: {
  titular: string;
  ejemplos: string[];
  /** Cómo se llama el hueco para quien navega con lector de pantalla. */
  etiquetaCampo: string;
  teach: string;
  alEscribir: (valor: string) => void;
  /** La cita, que baja de `Landing.tsx` para no tener el enlace en dos sitios. */
  agendarHref: string;
  agendarEtiqueta: string;
}) {
  return (
    <section
      id="top"
      // `data-tono` es lo que lee la cabecera para saber de qué color pintar el
      // wordmark cuando esta sección le pasa por debajo.
      // La portada es **tinta**, no hueso. Con ella el wordmark de la cabecera se
      // pinta claro desde el primer píxel.
      data-tono="ink"
      className="relative flex w-full flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f4f4ef]">
      {/* Los arcos, detrás de todo. Llevan su propio velo para que el titular no
          pierda contraste cuando un trazo le pasa por detrás. */}
      <Arcos />
      {/*
        En píxeles y no en `svh`, y por una razón medida: la cabecera fija ocupa
        82 px y con `pt-[15svh]` quedaban **41 px de aire** entre ella y el
        titular. En una ventana de navegador con su barra encima, eso se lee como
        el título pegado al marco. 200 px lo despegan de las dos cosas, y no
        encogen cuando la ventana es más baja — que es justo cuando peor se veía.
      */}
      <div className="relative z-10 flex w-full flex-col items-center px-5 pb-[130px] pt-[200px] sm:px-8">
        <h1 className="w-full max-w-6xl text-center text-[clamp(2.6rem,7.4vw,6.6rem)] font-medium leading-[1.04] tracking-[-0.03em]">
          {/* En bloque, y no como texto suelto seguido del hueco: con el
              interlineado apretado del titular la tinta se sale de su caja, y el
              hueco —que recorta— quedaba montado encima del final de la línea. La
              caja no está donde está la tinta, otra vez. */}
          <span className="block">{titular}</span>

          <TeachSlot
            ejemplos={ejemplos}
            etiqueta={etiquetaCampo}
            valor={teach}
            alEscribir={alEscribir}
          />
        </h1>

        {/*
          **Una sola cosa que hacer, y visible al llegar.**

          La regla de esta portada fue durante muchas pasadas «solo el titular y el
          portátil», y se cambió con una medida delante: la primera oportunidad de
          agendar estaba a **2,1 pantallas**, el 27 % del recorrido, así que quien
          entraba y no bajaba se iba sin haber tenido nunca nada que pulsar.

          Es un enlace de texto, no un botón: lo que no puede pasar es que la
          portada se llene. Si algún día estorba, se quita esto — no el titular.
        */}
        <a
          href={agendarHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => medir('agendar')}
          className="mt-10 flex min-h-[44px] items-center text-[clamp(1rem,1.3vw,1.2rem)] underline decoration-current/30 underline-offset-[0.4em] opacity-80 hover:decoration-current/70 hover:opacity-100"
          style={{ transition: 'opacity 400ms, text-decoration-color 400ms' }}>
          {agendarEtiqueta}
        </a>
      </div>

      {/*
        Más estrecho que la ventana: a sangre entraba de golpe. La entrada es de
        CSS, no de JavaScript.
      */}
      <div className="entra-abajo relative z-10 w-[86vw] max-w-[1560px]">
        <Mac />
      </div>

      {/* La sombra que disimulaba la costura se ha ido con el fondo blanco: la
          portada y `#idea` son ahora el mismo negro, así que no hay costura que
          disimular. Dejarla sería una banda oscura sobre un fondo ya oscuro. */}
    </section>
  );
}
