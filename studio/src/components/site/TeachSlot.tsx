'use client';

// `motion/react` y no `framer-motion`: es el mismo proyecto con el nombre nuevo,
// y el paquete viejo es el heredado. La migración es literalmente esta línea.
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from './motion';

/**
 * El hueco del titular: primero rota, y en cuanto lo tocas es un campo de texto.
 *
 * Es la pieza donde se junta lo que la página quería decir por separado. Toda la
 * landing existe para una pregunta —*¿qué quieres enseñar?*— que se hacía abajo
 * del todo, en el formulario, después de cuatro pantallas. Aquí se hace en la
 * primera línea, y lo que se escriba **baja al formulario ya relleno**.
 *
 * Los ejemplos que rotan no son adorno: hacen en un renglón lo que una galería de
 * tres pantallas intentaba hacer, que es enseñar de qué va esto. Masa madre,
 * apnea, Ableton, ebanistería, balances — el rango es el mensaje.
 *
 * ## La caja no se mueve, y sigue siendo toda la dificultad
 *
 * Las palabras miden distinto y el campo de texto también. Todo va **absoluto**
 * sobre el ancho completo de la línea, y el alto lo sostiene un `&nbsp;` que no se
 * ve. Así el titular mide lo mismo con `sourdough`, con `balance sheets` y con lo
 * que teclee quien entre.
 *
 * ## Con movimiento reducido
 *
 * No rota: se ve el campo desde el principio, con su marca de posición. Quien ha
 * pedido que no haya movimiento no tiene por qué esperar a que pase una palabra
 * para entender que ahí se escribe.
 */

/** Lo que dura cada ejemplo en pantalla. */
const TURNO = 2000;

/**
 * Cuánto se aparta un ejemplo que no está en su turno, en proporción al alto de
 * la caja.
 *
 * **Tiene que ser mayor que uno.** El original apartaba 150 px fijos, y con el
 * titular a 106 px la caja mide justo 150: la palabra que entraba tardaba todo el
 * viaje en salir del recorte, así que se la veía cruzar cortada por la mitad. Con
 * 1,6 la palabra está fuera del todo antes de empezar a verse, y lo único que se
 * ve es el relevo.
 */
const APARTE = 1.6;

/** Lo que tarda cada punto en aparecer, en milisegundos. */
const PUNTO = 320;

export function TeachSlot({
  ejemplos,
  etiqueta,
  valor,
  alEscribir,
}: {
  ejemplos: string[];
  /** El nombre del campo para un lector de pantalla, en el idioma de la página. */
  etiqueta: string;
  valor: string;
  alEscribir: (valor: string) => void;
}) {
  const [turno, setTurno] = useState(0);
  const [escribiendo, setEscribiendo] = useState(false);
  const [puntos, setPuntos] = useState(1);
  const [finDelTexto, setFinDelTexto] = useState(0);
  // El viaje se mide, no se escribe: depende del cuerpo del titular, que cambia
  // con el ancho de la ventana.
  const [viaje, setViaje] = useState(150);
  /** El alto del ejemplo más largo. Ver `medidor`. */
  const [alto, setAlto] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const espejo = useRef<HTMLSpanElement>(null);
  const medidor = useRef<HTMLSpanElement>(null);
  const linea = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  // El campo manda en cuanto alguien lo toca o hay algo escrito — aunque lo haya
  // escrito el formulario de abajo, que comparte el mismo valor.
  const activo = escribiendo || valor.length > 0 || reduced;

  useEffect(() => {
    if (activo || ejemplos.length < 2) return;

    const temporizador = setTimeout(() => setTurno((n) => (n + 1) % ejemplos.length), TURNO);
    return () => clearTimeout(temporizador);
  }, [turno, ejemplos.length, activo]);

  /*
   * Dónde acaba el texto, que es donde van los puntos.
   *
   * **Hay que medirlo.** El campo está centrado y ocupa todo el ancho de la
   * línea —es justo lo que mantiene quieta la caja del titular—, así que con CSS
   * no hay forma de anclar nada "al final de lo escrito": el final del texto no
   * es el final de la caja. Se pinta un `<span>` espejo invisible con el mismo
   * texto y la misma tipografía, se mide, y los puntos se ponen a media anchura
   * del centro. La misma lección de siempre aquí: la caja no está donde está la
   * tinta.
   */
  useEffect(() => {
    const nodo = espejo.current;
    if (!nodo) return;

    setFinDelTexto(nodo.getBoundingClientRect().width / 2);
  }, [valor]);

  /*
   * **Cuánto mide la caja, y por qué se mide en vez de escribirla.**
   *
   * La sostenía un `&nbsp;` con el interlineado del titular, así que medía una
   * línea y **solo una**. En una pantalla estrecha dos de los cinco ejemplos no
   * caben a lo ancho —«presentar mi empresa» pide unos 420 px y hay 350—, envuelven
   * a dos líneas, y con el `overflow: hidden` de la caja la segunda línea se
   * cortaba y la tinta se salía 20 px por arriba y por abajo, encima de la línea
   * anterior del titular. En escritorio los cinco caben en una línea y por eso no
   * se veía nunca.
   *
   * Ahora la caja mide lo que mide **el ejemplo más alto**: en escritorio sigue
   * siendo una línea y no cambia nada; en una pantalla estrecha son dos, y las
   * palabras cortas se quedan centradas. La caja sigue sin moverse al cambiar de
   * palabra, que es la regla de esta pieza desde el principio.
   *
   * Se mide y no se fija un número porque el texto cambia: hay versión en inglés y
   * en español, y una frase nueva en `textos.ts` no puede volver a romper esto.
   */
  useEffect(() => {
    const nodo = linea.current;
    const regla = medidor.current;
    if (!nodo) return;

    const medir = () => {
      setViaje(nodo.getBoundingClientRect().height * APARTE);

      if (!regla) return;
      let mayor = 0;
      regla.querySelectorAll<HTMLElement>('[data-ejemplo]').forEach((e) => {
        mayor = Math.max(mayor, e.getBoundingClientRect().height);
      });

      /*
       * Y se le suma el relleno de la caja.
       *
       * `min-height` cuenta desde el borde —`box-sizing: border-box`— y la regla
       * mide solo la tinta, así que sin esto la caja se queda corta justo por lo
       * que mide el `pt`/`pb` que lleva para que el recorte no se coma las astas:
       * el ejemplo de dos líneas volvía a asomar por abajo. Nueve píxeles, pero
       * son los nueve que se ven.
       */
      const estilo = getComputedStyle(nodo);
      setAlto(mayor + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom));
    };
    medir();

    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [ejemplos]);

  // Uno, dos, tres, y vuelta a empezar. Solo mientras se escribe.
  useEffect(() => {
    if (reduced || !escribiendo) return;

    const temporizador = setTimeout(() => setPuntos((n) => (n % 3) + 1), PUNTO);
    return () => clearTimeout(temporizador);
  }, [puntos, escribiendo, reduced]);

  /*
   * **El foco se pide aquí mismo, no en el fotograma siguiente.**
   *
   * Estuvo dentro de un `requestAnimationFrame`, con el argumento de que el campo
   * podía no estar pintado todavía. Es falso: un elemento con `opacity: 0` y
   * `pointer-events: none` **sí acepta el foco** — lo que no lo acepta es uno con
   * `display: none`, y este siempre está en el árbol.
   *
   * Y salía caro. En Safari ese fotograma de retraso llega después de la primera
   * tecla: pulsabas el hueco, escribías «bucear» y quedaba «ucear». En Chrome la
   * carrera se ganaba por poco y no se veía nunca — **el mismo código, dos
   * comportamientos**, que es justo lo que no se puede permitir aquí.
   *
   * `preventScroll` porque dar el foco puede arrastrar al contenedor que
   * scrollea, y esta es la primera línea de la página: no tiene a dónde ir.
   */
  const enfocar = () => {
    setEscribiendo(true);
    campo.current?.focus({ preventScroll: true });
  };

  return (
    <span
      ref={linea}
      /*
       * El relleno vertical evita que el recorte se coma las astas y los rabos:
       * la caja la sostiene un `&nbsp;` con el `line-height` apretado del titular,
       * y con `overflow: hidden` encima las letras salían cortadas por la mitad.
       */
      className="relative flex w-full justify-center overflow-hidden pb-[0.16em] pt-[0.06em] text-center leading-[1.2]"
      // El alto lo manda el ejemplo más largo. Hasta que se mide, el `&nbsp;`
      // sostiene una línea, que es lo que había antes: nada salta.
      style={alto ? { minHeight: alto } : undefined}>
      &nbsp;
      {/*
        La regla con la que se mide, invisible y fuera del flujo.

        Lleva el mismo ancho y la misma tipografía que los ejemplos de verdad
        —hereda del titular—, así que envuelve por donde envuelven ellos. Va con
        `invisible` y no con `display: none`: lo que no se pinta no se puede medir.

        `h-0` con su propio `overflow: hidden` para que no cuente como contenido
        de la caja: sin eso, cualquier comprobación de «¿hay algo recortado aquí?»
        —la que encontró este fallo— la señalaría a ella para siempre. Los hijos
        siguen colocándose y midiéndose igual aunque estén recortados.
      */}
      <span
        ref={medidor}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden font-semibold">
        {ejemplos.map((ejemplo) => (
          <span key={ejemplo} data-ejemplo className="block">
            {ejemplo}
          </span>
        ))}
      </span>
      {/* Los ejemplos. Se van cuando el campo toma el mando. */}
      {!activo &&
        ejemplos.map((ejemplo, index) => (
          <motion.button
            key={ejemplo}
            type="button"
            onClick={enfocar}
            /*
             * `inset-0` con centrado explícito, y no la posición estática que le
             * tocaría a un absoluto.
             *
             * Esa posición depende de dónde cae la línea del `&nbsp;`, y al subir
             * el cuerpo a 106 px dejó de coincidir: las palabras salían medio
             * fuera de la caja y el recorte las partía por la mitad. Centrando a
             * mano, el sitio no depende del tamaño de la letra.
             *
             * El texto rotando **es** el botón: si fuera un adorno con un botón
             * invisible encima, con el teclado no habría forma de llegar.
             */
            className="absolute inset-0 flex cursor-text items-center justify-center"
            initial={{ opacity: 0, y: viaje }}
            transition={{ type: 'spring', stiffness: 50 }}
            animate={
              turno === index
                ? { y: 0, opacity: 1 }
                : { y: turno > index ? -viaje : viaje, opacity: 0 }
            }>
            {/* El subrayado tiene que abrazar la palabra, no la línea entera. */}
            <span className="font-semibold underline decoration-current/25 decoration-[0.06em] underline-offset-[0.18em] hover:decoration-current/60">
              {ejemplo}
            </span>
          </motion.button>
        ))}

      <input
        ref={campo}
        value={valor}
        onChange={(event) => alEscribir(event.target.value)}
        onFocus={() => setEscribiendo(true)}
        onBlur={() => setEscribiendo(false)}
        // Enter no hace nada: un `<input>` suelto no manda ningún formulario, y
        // aquí no hay nada que mandar. Lo escrito baja al formulario del final por
        // el valor compartido, no por una tecla.
        onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
        aria-label={etiqueta}
        placeholder={reduced ? ejemplos[0] : ''}
        // `inset-0` y a ancho completo, igual que los ejemplos: es lo que
        // mantiene la caja del titular quieta escriba lo que escriba quien entre.
        // Y hereda tipografía y cuerpo, para que no se note el cambio de pieza.
        className={`absolute inset-0 w-full bg-transparent text-center font-semibold outline-none placeholder:opacity-30 ${
          activo ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
      />

      {/*
        El espejo. No se ve y no ocupa —va absoluto—, pero hereda tipografía y
        cuerpo del titular, así que mide exactamente lo mismo que lo escrito.
      */}
      <span
        ref={espejo}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre font-semibold">
        {valor}
      </span>

      {/* Los tres puntos, justo detrás de lo que se va escribiendo. */}
      {escribiendo && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 flex items-center font-semibold opacity-40"
          /*
           * El `min` es el tope, y hace falta: si lo escrito es más ancho que la
           * caja —y con el titular a 106 px basta una frase corriente— el final
           * del texto cae fuera de la pantalla, y los puntos se irían detrás. A
           * partir de ahí se quedan pegados al borde derecho, que es justo donde
           * el campo, centrado, deja de enseñar el texto.
           */
          style={{ left: `min(calc(50% + ${finDelTexto}px + 0.08em), calc(100% - 1.6em))` }}>
          {'.'.repeat(puntos)}
        </span>
      )}
    </span>
  );
}
