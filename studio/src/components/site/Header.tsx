'use client';

import { useEffect, useRef, useState } from 'react';

import { irA, subscribe } from './motion';

/**
 * La cabecera: **la marca, centrada**, fija sobre toda la página.
 *
 * Llegó a tener una píldora de enlaces y un botón ámbar. Los enlaces se fueron
 * con el dock, y el botón bajó a la portada, debajo del titular, donde puede ser
 * mucho más grande sin comprimir nada. Lo que queda es la marca y nada más, que
 * es lo que una cabecera fija tiene que ser cuando la página mide cuatro
 * pantallas.
 *
 * **Va en medio, no a la izquierda.** El titular de la portada está centrado, el
 * párrafo está centrado y los aparatos también: la marca arriba a la izquierda
 * era el único elemento fuera del eje de toda la página.
 *
 * **No se mueve, pero se aparta.** Está siempre en el mismo píxel —nada de
 * encogerse ni de reaparecer al subir, que es de donde venía la impresión de que
 * algo pasaba por encima—; lo único que hace es apagarse mientras hay texto
 * debajo. Ver el motivo en el bucle de pintado.
 *
 * ## El logo, y qué pasa mientras no exista
 *
 * Enseña `LOGO` si el archivo está, y **el wordmark de texto si no**. No es una
 * cortesía: mientras el archivo no esté en su sitio, una cabecera con una imagen
 * rota es peor que la que había. Con `onError` el cambio es inmediato y no hay
 * ningún fotograma con el icono de imagen partida.
 *
 * El día que el archivo aparezca en `public/imagenes/`, sale solo — no hay que
 * tocar nada aquí. Si acaba siendo un PNG, es cambiar la extensión de `LOGO`.
 */

/** Dónde se espera el logo. Un PNG vale igual: cambia solo la extensión. */
const LOGO = '/imagenes/logo.svg';

export function Header() {
  const marca = useRef<HTMLAnchorElement>(null);
  const imagen = useRef<HTMLImageElement>(null);
  const [hayLogo, setHayLogo] = useState(true);

  /*
   * **`onError` no basta, y aquí es lo que decide si se ve algo o no.**
   *
   * El HTML llega hecho desde el servidor, así que el navegador ya ha intentado
   * cargar la imagen —y ha fallado— **antes** de que React enganche el manejador.
   * Ese `error` no lo oye nadie: la cabecera se quedaba con un `<img>` roto de
   * cero píxeles de ancho y sin wordmark de recambio. En blanco, que es el peor
   * de los dos mundos.
   *
   * Al montar se pregunta por el estado real de la imagen: si terminó y no tiene
   * ancho natural, no hay archivo. El `onError` se queda igualmente para el caso
   * contrario —que falle después, ya en el cliente—.
   */
  useEffect(() => {
    const img = imagen.current;
    if (img?.complete && img.naturalWidth === 0) setHayLogo(false);
  }, []);

  /*
   * La marca se tiñe según la sección que tenga justo debajo.
   *
   * Cada bloque a sangre de la página se declara con `data-tono`, y aquí se
   * busca cuál de ellos cruza la altura del nombre. Se apunta a las secciones y
   * no al scroll —"a partir de tal píxel, negro"— porque un umbral en píxeles se
   * rompe en cuanto cambie el alto de cualquier bloque de encima, y esto no.
   *
   * Va en el mismo registro que las apariciones para no abrir otro bucle: el
   * progreso que reparte no se usa, lo que se aprovecha es que ya hay algo
   * mirando la posición en cada fotograma.
   *
   * Con el logo, el color se le da con `filter: invert(1)`: un `<img>` no hereda
   * `color`, y esto vale para cualquier archivo que llegue —trazo, mancha o
   * texto vectorizado— sin tener que abrirlo y tocarle los rellenos. Da por
   * hecho que el logo viene **en tinta sobre transparente**, que es como se
   * entrega un logotipo.
   */
  useEffect(() => {
    const node = marca.current;
    if (!node) return;

    return subscribe({
      node,
      span: 1,
      rise: 0,
      offset: 0,
      paint: () => {
        const caja = node.getBoundingClientRect();
        const altura = caja.top + caja.height / 2;

        let tono = 'bone';
        document.querySelectorAll<HTMLElement>('[data-tono]').forEach((seccion) => {
          const rect = seccion.getBoundingClientRect();
          if (rect.top <= altura && rect.bottom > altura) tono = seccion.dataset.tono ?? 'bone';
        });

        const claro = tono === 'ink';
        node.style.color = claro ? '#f4f4ef' : '#0a0a0a';
        if (imagen.current) imagen.current.style.filter = claro ? 'invert(1)' : 'none';

        /*
         * **Y se retira en cuanto empiezas a bajar.**
         *
         * Estando a la izquierda no molestaba a nadie: todo el contenido de la
         * página va centrado y por ahí no pasaba nunca. En el centro sí pasa —el
         * primer scroll ya monta el titular de una sección encima de la marca— y
         * dos textos superpuestos no se leen ni uno ni otro.
         *
         * Así que la marca vive en la portada, que es donde una cabecera dice
         * quién eres, y se aparta del camino en cuanto hay algo que leer. Vuelve
         * sola al subir. Se apaga solo la opacidad y en el mismo bucle que el
         * color: sin clases, sin otro oyente de scroll y sin mover nada de sitio.
         */
        const raiz = document.querySelector<HTMLElement>('[data-scroll-root]');
        const recorrido = raiz?.scrollTop ?? 0;
        const desvanece = Math.min(1, recorrido / (window.innerHeight * 0.35));
        node.style.opacity = String(1 - desvanece);
        node.style.pointerEvents = desvanece > 0.9 ? 'none' : 'auto';
      },
    });
  }, []);

  return (
    // `justify-center`: la marca va en el eje de la página, como todo lo demás.
    <header className="entra pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-center px-5 py-6 sm:px-8">
      <a
        ref={marca}
        href="#top"
        aria-label="Destrier"
        onClick={(event) => {
          event.preventDefault();
          irA('#top');
        }}
        // `py-2` para llegar a los 44 px de objetivo que pide la pauta de
        // accesibilidad: la marca mide 30 de alto y es un enlace que sube arriba.
        // El relleno no mueve la tinta, solo agranda la zona que se puede pulsar.
        className={`pointer-events-auto flex min-h-[44px] items-center py-2 ${
          hayLogo ? '' : 'wordmark-mark text-[clamp(22px,2.1vw,30px)] leading-none'
        }`}
        // El color de arranque, para que el primer fotograma no salga sin color
        // heredado antes de que el registro pinte.
        style={{ color: '#0a0a0a' }}>
        {hayLogo ? (
          /* Alto fijo y ancho automático: el logo manda su proporción, y así
             cualquier archivo que se deje ahí entra a la medida de la cabecera
             sin deformarse. El `alt` va vacío porque el nombre accesible ya lo
             pone el `aria-label` del enlace — repetirlo lo diría dos veces. */
          // eslint-disable-next-line @next/next/no-img-element -- el fallback necesita `onError`, que `next/image` no expone igual, y es un archivo estático de 1 petición.
          <img
            ref={imagen}
            src={LOGO}
            alt=""
            onError={() => setHayLogo(false)}
            className="block w-auto"
            style={{ height: 'clamp(24px, 2.4vw, 34px)' }}
          />
        ) : (
          // 30 px, y el tamaño es lo que hace que la gothic expandida funcione: a
          // 15 se leía como un logotipo pegado encima.
          'destrier'
        )}
      </a>
    </header>
  );
}
