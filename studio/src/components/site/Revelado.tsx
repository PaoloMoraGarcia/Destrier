'use client';

import { motion } from 'motion/react';

import { useReducedMotion } from './motion';

/**
 * Una frase que entra **desenfocándose hacia dentro**, palabra a palabra.
 *
 * Viene de un componente de fuera y se ha adaptado a las reglas de esta página,
 * no al revés.
 *
 * ## Por palabra, no por letra
 *
 * El original trocea por letra y mete cada una en su propio `<span>`. Eso **rompe
 * el espaciado entre pares que calcula la fuente**: en cuanto dos letras dejan de
 * estar en la misma caja, el kerning que la tipografía había decidido para ese par
 * desaparece. Es un problema conocido en este proyecto —hay una regla escrita sobre
 * él— y el propio componente original lo delata: trae una propiedad
 * `letterSpacing` que existe solo para parchear a mano lo que el troceo estropea.
 *
 * Aquí se trocea por palabra. Con una frase corta el efecto se ve igual, y las
 * letras de cada palabra siguen juntas, que es donde el kerning importa.
 *
 * ## Y el texto está siempre, aunque no haya movimiento
 *
 * Con `prefers-reduced-motion` **no se anima nada**: la frase se pinta entera desde
 * el primer fotograma. No es cortesía — la regla dura de esta página es que el
 * texto nunca dependa de que una animación llegue a correr, y esta pieza se usa en
 * la línea grande de una sección.
 *
 * Arranca **al aparecer en pantalla** y una sola vez, porque vive a media página:
 * animarla al cargar sería gastar el efecto donde nadie está mirando.
 */

/** Cuánto tarda cada palabra, y cuánto se espera entre una y la siguiente. */
const PALABRA = 0.55;
const RELEVO = 0.09;

export function Revelado({
  children,
  className,
  style,
  estiloPalabra,
  como: Como = 'span',
}: {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Estilo que se aplica a **cada palabra**, no al conjunto.
   *
   * Existe por el subrayado, y es una trampa que cuesta ver: cada palabra va en un
   * `inline-block` —hace falta para poder desenfocarla y moverla—, y el subrayado
   * del padre **no se dibuja por encima de una caja en línea atómica**. La raya
   * salía en el `<p>` y no se veía ni un píxel. Puesta en cada palabra sí se pinta,
   * y sale continua porque el espacio va dentro de la palabra que lo precede.
   */
  estiloPalabra?: React.CSSProperties;
  /** La etiqueta que se pinta. Por defecto un `span`, que no fuerza bloque. */
  como?: 'span' | 'p' | 'h2' | 'h3';
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <Como className={className} style={{ ...style, ...estiloPalabra }}>
        {children}
      </Como>
    );
  }

  const palabras = children.split(' ');

  return (
    <Como className={className} style={style}>
      {/*
        La frase entera para quien la escucha. Las palabras de abajo van
        `aria-hidden` porque troceadas se leerían de una en una, con su pausa.
      */}
      <span className="sr-only">{children}</span>

      {palabras.map((palabra, i) => (
        <motion.span
          key={`${palabra}-${i}`}
          aria-hidden
          // `inline-block` para que el desenfoque y el desplazamiento se apliquen
          // a la palabra entera; en `inline` no hay transformación que valga.
          className="inline-block"
          style={estiloPalabra}
          initial={{ opacity: 0, filter: 'blur(10px)', y: '0.22em' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: PALABRA, delay: i * RELEVO, ease: [0.65, 0.05, 0.36, 1] }}>
          {palabra}
          {/* El espacio va dentro de la palabra que lo precede y no en un
              elemento aparte: como `span` suelto, un salto de línea lo dejaba
              colgando al principio del renglón siguiente. */}
          {i < palabras.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </Como>
  );
}
