'use client';

import type { ReactNode } from 'react';

import { EASE, irA } from './motion';

/**
 * El botón de la página. Hay dos y son el mismo: el de debajo del titular, que
 * baja al formulario, y el del formulario, que abre el correo.
 *
 * Existe como pieza aparte justo por eso — antes el marcado estaba escrito dos
 * veces, y dos copias de un botón se separan a la primera que alguien toque una.
 *
 * Sigue siendo un enlace de verdad, así que se puede copiar y abrir aparte. Si
 * apunta a un ancla de esta página, la bajada la hace `irA`: el ancla nativa no
 * sabe nada del contenedor de scroll y saltaría de golpe.
 */
export function Cta({
  href,
  children,
  tone = 'desnudo',
  ...resto
}: {
  href: string;
  children: ReactNode;
  tone?: 'desnudo' | 'ink';
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  /*
   * **El ámbar se fue.** Era el único color de la marca y en la práctica era una
   * píldora naranja enorme en medio de una página en blanco y negro: cantaba y no
   * pertenecía. Lo que queda en `#idea` es la palabra sola, en la manuscrita, con
   * un subrayado que se enciende al pasar por encima — sigue leyéndose como algo
   * que se pulsa sin meter un bloque de color en una página que no los tiene.
   */
  const tonos = {
    desnudo: 'underline decoration-current/25 underline-offset-[0.14em] hover:decoration-current',
    ink: 'bg-[#0a0a0a] text-[#f4f4ef]',
  };

  return (
    <a
      href={href}
      onClick={(event) => {
        if (!href.startsWith('#')) return;
        event.preventDefault();
        irA(href);
      }}
      /*
       * En la **grotesca del titular**, no en la monoespaciada.
       *
       * La mono es la letra de los datos pequeños de esta página —los `01 · 02 ·
       * 03`, los rótulos— y a tamaño de botón se leía como una etiqueta grande en
       * vez de como una acción. Esta es la misma con la que está escrito *I want
       * to teach*, y en caja baja: las versales eran parte del mismo problema.
       *
       * `whitespace-nowrap`: con el cuerpo grande y una pantalla estrecha, la
       * etiqueta partía en dos líneas y el botón se deformaba.
       */
      className={`inline-flex whitespace-nowrap ${
        tone === 'ink' ? 'rounded-full' : ''
      } px-10 py-5 text-[clamp(1.05rem,1.5vw,1.35rem)] font-medium tracking-[-0.01em] ${tonos[tone]}`}
      style={{ transition: `transform 500ms ${EASE}` }}
      {...resto}>
      {children}
    </a>
  );
}
